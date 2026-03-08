import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-e2e';
import { createProject, registerUser } from './helpers';

describe('Tasks (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('tasks -> create -> list (filter by projectId) -> update -> delete', async () => {
    const user = await registerUser(app, {
      email: `e2e_task_${Date.now()}@example.com`,
      name: 'E2E Task User',
    });

    const createdProject = await createProject(app, user.accessToken, {
      name: 'Tasks Project',
      description: 'Project for tasks e2e',
    });

    const projectId = createdProject.projectId;

    const createdTask = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Task 1',
        description: 'Desc 1',
        projectId,
        status: 'TODO',
        priority: 'MEDIUM',
      })
      .expect(201);

    const taskId = createdTask.body.id as string;

    const list = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(list.body.items)).toBe(true);
    expect(list.body.items.some((t: any) => t.id === taskId)).toBe(true);

    const updated = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    expect(updated.body.status).toBe('IN_PROGRESS');

    const deleted = await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(deleted.body).toEqual({ ok: true });

    const list2 = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(list2.body.items.some((t: any) => t.id === taskId)).toBe(false);
  });

  it('permissions -> outsider cannot access tasks/comments of a project', async () => {
    const owner = await registerUser(app, {
      email: `e2e_perm_owner_${Date.now()}@example.com`,
      name: 'Owner',
    });

    const outsider = await registerUser(app, {
      email: `e2e_perm_out_${Date.now()}@example.com`,
      name: 'Outsider',
    });

    const project = await createProject(app, owner.accessToken, {
      name: 'Perm Project',
      description: 'perm e2e',
    });

    const projectId = project.projectId;

    const task = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Perm Task',
        projectId,
        status: 'TODO',
        priority: 'MEDIUM',
      })
      .expect(201);

    const taskId = task.body.id as string;

    await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ content: 'nope', taskId })
      .expect(403);

    await request(app.getHttpServer())
      .get(`/comments?taskId=${taskId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(403);
  });

  it('tasks list -> supports filters/search/sort/dueDate range', async () => {
    const user = await registerUser(app, {
      email: `e2e_query_${Date.now()}@example.com`,
      name: 'Query User',
    });

    const createdProject = await createProject(app, user.accessToken, {
      name: 'Query Project',
      description: 'Project for query tests',
    });

    const projectId = createdProject.projectId;

    const due1 = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const due2 = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const t1 = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Fix login bug',
        description: 'auth module bug',
        projectId,
        status: 'TODO',
        priority: 'HIGH',
        dueDate: due1,
      })
      .expect(201);

    const t2 = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Write docs',
        description: 'README improvements',
        projectId,
        status: 'IN_PROGRESS',
        priority: 'LOW',
        dueDate: due2,
      })
      .expect(201);

    const t3 = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Refactor tasks',
        description: 'cleanup and refactor',
        projectId,
        status: 'DONE',
        priority: 'MEDIUM',
      })
      .expect(201);

    const listTodo = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&status=TODO&page=1&limit=10`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(listTodo.body.items.some((x: any) => x.id === t1.body.id)).toBe(
      true,
    );
    expect(listTodo.body.items.some((x: any) => x.id === t2.body.id)).toBe(
      false,
    );

    const listSearch = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&search=auth&page=1&limit=10`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(listSearch.body.items.some((x: any) => x.id === t1.body.id)).toBe(
      true,
    );
    expect(listSearch.body.items.some((x: any) => x.id === t2.body.id)).toBe(
      false,
    );

    const dueFrom = new Date(Date.now()).toISOString();
    const dueTo = new Date(
      Date.now() + 2 * 24 * 3600 * 1000,
    ).toISOString();

    const listDue = await request(app.getHttpServer())
      .get(
        `/tasks?projectId=${projectId}&dueFrom=${encodeURIComponent(
          dueFrom,
        )}&dueTo=${encodeURIComponent(dueTo)}&page=1&limit=10`,
      )
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(listDue.body.items.some((x: any) => x.id === t1.body.id)).toBe(true);
    expect(listDue.body.items.some((x: any) => x.id === t2.body.id)).toBe(
      false,
    );

    const listSort = await request(app.getHttpServer())
      .get(
        `/tasks?projectId=${projectId}&sortBy=createdAt&order=asc&page=1&limit=10`,
      )
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(listSort.body.items[0].id).toBe(t1.body.id);
    expect(t3.body.id).toBeTruthy();
  });

  it('tasks list -> supports assignedTo=me and createdBy=me filters', async () => {
    const user = await registerUser(app, {
      email: `e2e_assign_${Date.now()}@example.com`,
      name: 'Assign User',
    });

    const project = await createProject(app, user.accessToken, {
      name: 'Assign Project',
      description: 'Project for assignment filters',
    });

    const projectId = project.projectId;
    const userId = user.user.id as string;

    const taskA = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Assigned to me',
        projectId,
        assignedToId: userId,
        status: 'TODO',
        priority: 'MEDIUM',
      })
      .expect(201);

    const taskB = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Not assigned',
        projectId,
        status: 'TODO',
        priority: 'MEDIUM',
      })
      .expect(201);

    const listAssignedToMe = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&assignedTo=me&page=1&limit=10`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(
      listAssignedToMe.body.items.some((t: any) => t.id === taskA.body.id),
    ).toBe(true);
    expect(
      listAssignedToMe.body.items.some((t: any) => t.id === taskB.body.id),
    ).toBe(false);

    const listCreatedByMe = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&createdBy=me&page=1&limit=10`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(
      listCreatedByMe.body.items.some((t: any) => t.id === taskA.body.id),
    ).toBe(true);
    expect(
      listCreatedByMe.body.items.some((t: any) => t.id === taskB.body.id),
    ).toBe(true);
  });
});