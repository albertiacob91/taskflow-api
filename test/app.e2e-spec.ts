import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TaskFlow API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register -> returns accessToken', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'Password123!',
        name: 'E2E User',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(email);
  });

  it('users/me -> requires jwt and returns current user', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'Password123!',
        name: 'E2E User',
      })
      .expect(201);

    const token = register.body.accessToken;

    const me = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body.email).toBe(email);
    expect(me.body).toHaveProperty('id');
  });

  it('projects -> create -> list -> update -> delete (owner)', async () => {
    const email = `e2e_proj_${Date.now()}@example.com`;

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'Password123!',
        name: 'E2E Project User',
      })
      .expect(201);

    const token = register.body.accessToken as string;

    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Project A', description: 'Desc A' })
      .expect(201);

    expect(created.body).toHaveProperty('id');
    const projectId = created.body.id as string;

    const list1 = await request(app.getHttpServer())
      .get('/projects?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(list1.body.items)).toBe(true);
    expect(list1.body.items.some((p: any) => p.id === projectId)).toBe(true);

    const updated = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Project A (updated)' })
      .expect(200);

    expect(updated.body.name).toBe('Project A (updated)');

    const deleted = await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(deleted.body).toEqual({ ok: true });

    const list2 = await request(app.getHttpServer())
      .get('/projects?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list2.body.items.some((p: any) => p.id === projectId)).toBe(false);
  });

  it('tasks -> create -> list (filter by projectId) -> update -> delete', async () => {
  const email = `e2e_task_${Date.now()}@example.com`;

  // register
  const register = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password: 'Password123!',
      name: 'E2E Task User',
    })
    .expect(201);

  const token = register.body.accessToken as string;

  // create project (needed for tasks)
  const createdProject = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Tasks Project', description: 'Project for tasks e2e' })
    .expect(201);

  const projectId = createdProject.body.id as string;

  // create task
  const createdTask = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Task 1',
      description: 'Desc 1',
      projectId,
      status: 'TODO',
      priority: 'MEDIUM',
    })
    .expect(201);

  expect(createdTask.body).toHaveProperty('id');
  const taskId = createdTask.body.id as string;

  // list tasks filtered by projectId (should include)
  const list = await request(app.getHttpServer())
    .get(`/tasks?projectId=${projectId}&page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(Array.isArray(list.body.items)).toBe(true);
  expect(list.body.items.some((t: any) => t.id === taskId)).toBe(true);

  // update task
  const updated = await request(app.getHttpServer())
    .patch(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'IN_PROGRESS' })
    .expect(200);

  expect(updated.body.status).toBe('IN_PROGRESS');

  // delete task (soft)
  const deleted = await request(app.getHttpServer())
    .delete(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(deleted.body).toEqual({ ok: true });

  // list again (should NOT include after soft delete)
  const list2 = await request(app.getHttpServer())
    .get(`/tasks?projectId=${projectId}&page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(list2.body.items.some((t: any) => t.id === taskId)).toBe(false);
});

it('comments -> create -> list (filter by taskId) -> update -> delete (author only)', async () => {
  const email = `e2e_comment_${Date.now()}@example.com`;

  // register
  const register = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password: 'Password123!',
      name: 'E2E Comment User',
    })
    .expect(201);

  const token = register.body.accessToken as string;

  // create project
  const createdProject = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Comments Project', description: 'Project for comments e2e' })
    .expect(201);

  const projectId = createdProject.body.id as string;

  // create task
  const createdTask = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Comment Task',
      description: 'Task for comments',
      projectId,
      status: 'TODO',
      priority: 'MEDIUM',
    })
    .expect(201);

  const taskId = createdTask.body.id as string;

  // create comment
  const createdComment = await request(app.getHttpServer())
    .post('/comments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      content: 'First comment!',
      taskId,
    })
    .expect(201);

  expect(createdComment.body).toHaveProperty('id');
  const commentId = createdComment.body.id as string;

  // list comments filtered by taskId
  const list = await request(app.getHttpServer())
    .get(`/comments?taskId=${taskId}&page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(Array.isArray(list.body.items)).toBe(true);
  expect(list.body.items.some((c: any) => c.id === commentId)).toBe(true);

  // update comment (author)
  const updated = await request(app.getHttpServer())
    .patch(`/comments/${commentId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ content: 'Updated comment!' })
    .expect(200);

  expect(updated.body.content).toBe('Updated comment!');

  // delete comment (soft)
  const deleted = await request(app.getHttpServer())
    .delete(`/comments/${commentId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(deleted.body).toEqual({ ok: true });

  // list again (should NOT include after soft delete)
  const list2 = await request(app.getHttpServer())
    .get(`/comments?taskId=${taskId}&page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(list2.body.items.some((c: any) => c.id === commentId)).toBe(false);
});
});