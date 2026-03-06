import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TaskFlow API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);

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
  await app?.close();
});

  it('register -> returns accessToken', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'E2E User' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(email);
  });

  it('users/me -> requires jwt and returns current user', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'E2E User' })
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
      .send({ email, password: 'Password123!', name: 'E2E Project User' })
      .expect(201);

    const token = register.body.accessToken as string;

    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Project A', description: 'Desc A' })
      .expect(201);

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

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'E2E Task User' })
      .expect(201);

    const token = register.body.accessToken as string;

    const createdProject = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tasks Project', description: 'Project for tasks e2e' })
      .expect(201);

    const projectId = createdProject.body.id as string;

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

    const taskId = createdTask.body.id as string;

    const list = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(list.body.items)).toBe(true);
    expect(list.body.items.some((t: any) => t.id === taskId)).toBe(true);

    const updated = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    expect(updated.body.status).toBe('IN_PROGRESS');

    const deleted = await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(deleted.body).toEqual({ ok: true });

    const list2 = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list2.body.items.some((t: any) => t.id === taskId)).toBe(false);
  });

  it('comments -> create -> list (filter by taskId) -> update -> delete (author only)', async () => {
    const email = `e2e_comment_${Date.now()}@example.com`;

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'E2E Comment User' })
      .expect(201);

    const token = register.body.accessToken as string;

    const createdProject = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Comments Project', description: 'Project for comments e2e' })
      .expect(201);

    const projectId = createdProject.body.id as string;

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

    const createdComment = await request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'First comment!', taskId })
      .expect(201);

    const commentId = createdComment.body.id as string;

    const list = await request(app.getHttpServer())
      .get(`/comments?taskId=${taskId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(list.body.items)).toBe(true);
    expect(list.body.items.some((c: any) => c.id === commentId)).toBe(true);

    const updated = await request(app.getHttpServer())
      .patch(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated comment!' })
      .expect(200);

    expect(updated.body.content).toBe('Updated comment!');

    const deleted = await request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(deleted.body).toEqual({ ok: true });

    const list2 = await request(app.getHttpServer())
      .get(`/comments?taskId=${taskId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list2.body.items.some((c: any) => c.id === commentId)).toBe(false);
  });

  it('auth refresh -> rotates token and logout revokes it (jti)', async () => {
    const email = `e2e_refresh_${Date.now()}@example.com`;

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'Refresh User' })
      .expect(201);

    const refresh1 = register.body.refreshToken as string;

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh1 })
      .expect(201);

    const refresh2 = refreshed.body.refreshToken as string;
    expect(refresh2).not.toBe(refresh1);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh1 })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: refresh2 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh2 })
      .expect(401);

    const userRow = await prisma.user.findFirst({
      where: { email },
      select: { refreshTokenJti: true },
    });

    expect(userRow?.refreshTokenJti).toBeNull();
  });

  it('users list -> forbidden for USER, allowed for ADMIN', async () => {
  // USER
  const emailUser = `e2e_user_${Date.now()}@example.com`;
  const regUser = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: emailUser, password: 'Password123!', name: 'User' })
    .expect(201);

  const tokenUser = regUser.body.accessToken as string;

  await request(app.getHttpServer())
    .get('/users')
    .set('Authorization', `Bearer ${tokenUser}`)
    .expect(403);

  // ADMIN
  const emailAdmin = `e2e_admin_${Date.now()}@example.com`;
  const regAdmin = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: emailAdmin, password: 'Password123!', name: 'Admin' })
    .expect(201);

  const adminId = regAdmin.body.user.id as string;

  // promote in DB
  await prisma.user.update({
    where: { id: adminId },
    data: { role: 'ADMIN' },
  });

  // login to get a fresh token (optional, but clear)
  const loginAdmin = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: emailAdmin, password: 'Password123!' })
    .expect(201);

  const tokenAdmin = loginAdmin.body.accessToken as string;

  const list = await request(app.getHttpServer())
    .get('/users')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .expect(200);

  expect(Array.isArray(list.body)).toBe(true);
  expect(list.body.some((u: any) => u.email === emailAdmin)).toBe(true);
});

it('projects members -> owner can add/remove, member can view, outsider forbidden', async () => {
  // owner
  const ownerEmail = `e2e_owner_${Date.now()}@example.com`;
  const ownerReg = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: ownerEmail, password: 'Password123!', name: 'Owner' })
    .expect(201);

  const ownerToken = ownerReg.body.accessToken as string;

  // member
  const memberEmail = `e2e_member_${Date.now()}@example.com`;
  const memberReg = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: memberEmail, password: 'Password123!', name: 'Member' })
    .expect(201);

  const memberToken = memberReg.body.accessToken as string;
  const memberId = memberReg.body.user.id as string;

  // outsider
  const outsiderEmail = `e2e_out_${Date.now()}@example.com`;
  const outsiderReg = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: outsiderEmail, password: 'Password123!', name: 'Outsider' })
    .expect(201);

  const outsiderToken = outsiderReg.body.accessToken as string;

  // create project (owner)
  const project = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Members Project', description: 'Project members e2e' })
    .expect(201);

  const projectId = project.body.id as string;

  // owner adds member by email
  await request(app.getHttpServer())
    .post(`/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ email: memberEmail })
    .expect(201);

  // member can list members
  const listAsMember = await request(app.getHttpServer())
    .get(`/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${memberToken}`)
    .expect(200);

  expect(listAsMember.body).toHaveProperty('owner');
  expect(Array.isArray(listAsMember.body.members)).toBe(true);
  expect(listAsMember.body.members.some((u: any) => u.email === memberEmail)).toBe(true);

  // outsider forbidden
  await request(app.getHttpServer())
    .get(`/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${outsiderToken}`)
    .expect(403);

  // owner removes member
  await request(app.getHttpServer())
    .delete(`/projects/${projectId}/members/${memberId}`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .expect(200);

  // member now forbidden
  await request(app.getHttpServer())
    .get(`/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${memberToken}`)
    .expect(403);

  // member should see project in /projects before removal, and not after removal
  // (after removal, /projects list should not include it)
  const listProjectsAfter = await request(app.getHttpServer())
    .get('/projects?page=1&limit=50')
    .set('Authorization', `Bearer ${memberToken}`)
    .expect(200);

  expect(listProjectsAfter.body.items.some((p: any) => p.id === projectId)).toBe(false);
});
it('permissions -> outsider cannot access tasks/comments of a project', async () => {
  // owner creates project and task
  const ownerEmail = `e2e_perm_owner_${Date.now()}@example.com`;
  const ownerReg = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: ownerEmail, password: 'Password123!', name: 'Owner' })
    .expect(201);

  const ownerToken = ownerReg.body.accessToken as string;

  const outsiderEmail = `e2e_perm_out_${Date.now()}@example.com`;
  const outsiderReg = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: outsiderEmail, password: 'Password123!', name: 'Outsider' })
    .expect(201);

  const outsiderToken = outsiderReg.body.accessToken as string;

  const project = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Perm Project', description: 'perm e2e' })
    .expect(201);

  const projectId = project.body.id as string;

  const task = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ title: 'Perm Task', projectId, status: 'TODO', priority: 'MEDIUM' })
    .expect(201);

  const taskId = task.body.id as string;

  // outsider cannot list tasks
  await request(app.getHttpServer())
    .get(`/tasks?projectId=${projectId}&page=1&limit=10`)
    .set('Authorization', `Bearer ${outsiderToken}`)
    .expect(403);

  // outsider cannot create comment
  await request(app.getHttpServer())
    .post('/comments')
    .set('Authorization', `Bearer ${outsiderToken}`)
    .send({ content: 'nope', taskId })
    .expect(403);

  // outsider cannot list comments
  await request(app.getHttpServer())
    .get(`/comments?taskId=${taskId}&page=1&limit=10`)
    .set('Authorization', `Bearer ${outsiderToken}`)
    .expect(403);
});

it('tasks list -> supports filters/search/sort/dueDate range', async () => {
  const email = `e2e_query_${Date.now()}@example.com`;

  const register = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'Password123!', name: 'Query User' })
    .expect(201);

  const token = register.body.accessToken as string;

  // create project
  const createdProject = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Query Project', description: 'Project for query tests' })
    .expect(201);

  const projectId = createdProject.body.id as string;

  // create tasks with dueDate
  const due1 = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); // +1 day
  const due2 = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // +7 days

  const t1 = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
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
    .set('Authorization', `Bearer ${token}`)
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
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Refactor tasks',
      description: 'cleanup and refactor',
      projectId,
      status: 'DONE',
      priority: 'MEDIUM',
    })
    .expect(201);

  // 1) filter by status
  const listTodo = await request(app.getHttpServer())
    .get(`/tasks?projectId=${projectId}&status=TODO&page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(listTodo.body.items.some((x: any) => x.id === t1.body.id)).toBe(true);
  expect(listTodo.body.items.some((x: any) => x.id === t2.body.id)).toBe(false);

  // 2) search in title/description
  const listSearch = await request(app.getHttpServer())
    .get(`/tasks?projectId=${projectId}&search=auth&page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(listSearch.body.items.some((x: any) => x.id === t1.body.id)).toBe(true);
  expect(listSearch.body.items.some((x: any) => x.id === t2.body.id)).toBe(false);

  // 3) dueDate range (include t1, exclude t2)
  const dueFrom = new Date(Date.now()).toISOString();
  const dueTo = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(); // +2 days

  const listDue = await request(app.getHttpServer())
    .get(
      `/tasks?projectId=${projectId}&dueFrom=${encodeURIComponent(
        dueFrom,
      )}&dueTo=${encodeURIComponent(dueTo)}&page=1&limit=10`,
    )
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(listDue.body.items.some((x: any) => x.id === t1.body.id)).toBe(true);
  expect(listDue.body.items.some((x: any) => x.id === t2.body.id)).toBe(false);

  // 4) sorting createdAt asc (t1 should be first because we created in order)
  const listSort = await request(app.getHttpServer())
    .get(`/tasks?projectId=${projectId}&sortBy=createdAt&order=asc&page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(listSort.body.items[0].id).toBe(t1.body.id);

  // keep strict
  expect(t3.body.id).toBeTruthy();
});

it('tasks list -> supports assignedTo=me and createdBy=me filters', async () => {
  const email = `e2e_assign_${Date.now()}@example.com`;

  const register = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'Password123!', name: 'Assign User' })
    .expect(201);

  const token = register.body.accessToken as string;
  const userId = register.body.user.id as string;

  const project = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Assign Project', description: 'Project for assignment filters' })
    .expect(201);

  const projectId = project.body.id as string;

  // Task A: createdBy=me, assignedTo=me
  const taskA = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Assigned to me',
      projectId,
      assignedToId: userId,
      status: 'TODO',
      priority: 'MEDIUM',
    })
    .expect(201);

  // Task B: createdBy=me, assignedTo=null
  const taskB = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Not assigned',
      projectId,
      status: 'TODO',
      priority: 'MEDIUM',
    })
    .expect(201);

  // 1) assignedTo=me should include taskA and exclude taskB
  const listAssignedToMe = await request(app.getHttpServer())
    .get(`/tasks?projectId=${projectId}&assignedTo=me&page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(listAssignedToMe.body.items.some((t: any) => t.id === taskA.body.id)).toBe(true);
  expect(listAssignedToMe.body.items.some((t: any) => t.id === taskB.body.id)).toBe(false);

  // 2) createdBy=me should include both taskA and taskB
  const listCreatedByMe = await request(app.getHttpServer())
    .get(`/tasks?projectId=${projectId}&createdBy=me&page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(listCreatedByMe.body.items.some((t: any) => t.id === taskA.body.id)).toBe(true);
  expect(listCreatedByMe.body.items.some((t: any) => t.id === taskB.body.id)).toBe(true);
});

it('health -> returns ok and sets x-request-id header', async () => {
  const res = await request(app.getHttpServer())
    .get('/health')
    .expect(200);

  expect(res.body).toEqual({ ok: true });
  expect(res.headers).toHaveProperty('x-request-id');
});

it('auth login -> rate limit returns 429 after too many requests', async () => {
  const email = `e2e_rate_${Date.now()}@example.com`;
  const password = 'Password123!';

  // register user
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password, name: 'Rate User' })
    .expect(201);

  let lastStatus = 0;

  // attempt login many times
  for (let i = 0; i < 12; i++) {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    lastStatus = res.status;

    if (res.status === 429) break;
  }

  expect(lastStatus).toBe(429);
});

it('activity api -> supports my activity and admin user activity', async () => {
  const email = `e2e_activity_api_${Date.now()}@example.com`;

  const register = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'Password123!', name: 'Activity API User' })
    .expect(201);

  const token = register.body.accessToken as string;
  const userId = register.body.user.id as string;

  const project = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Activity API Project', description: 'activity api test' })
    .expect(201);

  const projectId = project.body.id as string;

  await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Activity API Task',
      projectId,
      status: 'TODO',
      priority: 'MEDIUM',
    })
    .expect(201);

  const myActivity = await request(app.getHttpServer())
    .get('/activity?page=1&limit=20')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(Array.isArray(myActivity.body.items)).toBe(true);
  expect(myActivity.body.items.some((x: any) => x.actorId === userId)).toBe(true);

  const adminEmail = `e2e_activity_admin_${Date.now()}@example.com`;
  const regAdmin = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: adminEmail, password: 'Password123!', name: 'Admin' })
    .expect(201);

  const adminId = regAdmin.body.user.id as string;

  await prisma.user.update({
    where: { id: adminId },
    data: { role: 'ADMIN' },
  });

  const adminToken = regAdmin.body.accessToken as string;

  const userActivity = await request(app.getHttpServer())
    .get(`/users/${userId}/activity?page=1&limit=20`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  expect(Array.isArray(userActivity.body.items)).toBe(true);
  expect(userActivity.body.items.some((x: any) => x.actorId === userId)).toBe(true);

  await request(app.getHttpServer())
    .get(`/users/${userId}/activity?page=1&limit=20`)
    .set('Authorization', `Bearer ${token}`)
    .expect(403);

  const projectActivity = await request(app.getHttpServer())
    .get(`/projects/${projectId}/activity?page=1&limit=20`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(Array.isArray(projectActivity.body.items)).toBe(true);
});

it('project activity -> returns logs for project actions', async () => {
  const email = `e2e_activity_${Date.now()}@example.com`;

  const register = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'Password123!', name: 'Activity User' })
    .expect(201);

  const token = register.body.accessToken as string;

  // create project -> should log PROJECT_CREATED
  const createdProject = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Activity Project', description: 'Project for activity logs' })
    .expect(201);

  const projectId = createdProject.body.id as string;

  // create task -> should log TASK_CREATED
  await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Activity Task',
      description: 'Task for activity logs',
      projectId,
      status: 'TODO',
      priority: 'MEDIUM',
    })
    .expect(201);

  // list activity
  const activity = await request(app.getHttpServer())
    .get(`/projects/${projectId}/activity?page=1&limit=20`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(Array.isArray(activity.body.items)).toBe(true);

  const types = activity.body.items.map((x: any) => x.type);

  expect(types).toContain('PROJECT_CREATED');
  expect(types).toContain('TASK_CREATED');
});

it('attachments -> upload -> list -> delete', async () => {
  const email = `e2e_attach_${Date.now()}@example.com`;

  const register = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'Password123!', name: 'Attach User' })
    .expect(201);

  const token = register.body.accessToken as string;

  const project = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Attachment Project', description: 'attachments test' })
    .expect(201);

  const projectId = project.body.id as string;

  const task = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Attachment Task',
      projectId,
      status: 'TODO',
      priority: 'MEDIUM',
    })
    .expect(201);

  const taskId = task.body.id as string;

  const upload = await request(app.getHttpServer())
    .post(`/tasks/${taskId}/attachments`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', Buffer.from('hello attachment'), 'note.txt')
    .expect(201);

  expect(upload.body).toHaveProperty('id');
  expect(upload.body.originalName).toBe('note.txt');

  const attachmentId = upload.body.id as string;

  const list = await request(app.getHttpServer())
    .get(`/tasks/${taskId}/attachments`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(Array.isArray(list.body)).toBe(true);
  expect(list.body.some((a: any) => a.id === attachmentId)).toBe(true);

  await request(app.getHttpServer())
    .delete(`/attachments/${attachmentId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const listAfter = await request(app.getHttpServer())
    .get(`/tasks/${taskId}/attachments`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(listAfter.body.some((a: any) => a.id === attachmentId)).toBe(false);
});

it('notifications -> task assigned and comment added', async () => {
  const ownerEmail = `e2e_notif_owner_${Date.now()}@example.com`;
  const ownerReg = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: ownerEmail, password: 'Password123!', name: 'Owner' })
    .expect(201);

  const ownerToken = ownerReg.body.accessToken as string;

  const memberEmail = `e2e_notif_member_${Date.now()}@example.com`;
  const memberReg = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: memberEmail, password: 'Password123!', name: 'Member' })
    .expect(201);

  const memberToken = memberReg.body.accessToken as string;
  const memberId = memberReg.body.user.id as string;

  const project = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Notifications Project', description: 'notifications test' })
    .expect(201);

  const projectId = project.body.id as string;

  await request(app.getHttpServer())
    .post(`/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ email: memberEmail })
    .expect(201);

  const task = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      title: 'Notifications Task',
      projectId,
      status: 'TODO',
      priority: 'MEDIUM',
      assignedToId: memberId,
    })
    .expect(201);

  const taskId = task.body.id as string;

  const memberNotifications1 = await request(app.getHttpServer())
    .get('/notifications?page=1&limit=20')
    .set('Authorization', `Bearer ${memberToken}`)
    .expect(200);

  expect(Array.isArray(memberNotifications1.body.items)).toBe(true);
  expect(
    memberNotifications1.body.items.some((n: any) => n.type === 'TASK_ASSIGNED'),
  ).toBe(true);

  await request(app.getHttpServer())
    .post('/comments')
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ content: 'Hello owner', taskId })
    .expect(201);

  const ownerNotifications = await request(app.getHttpServer())
    .get('/notifications?page=1&limit=20')
    .set('Authorization', `Bearer ${ownerToken}`)
    .expect(200);

  expect(
    ownerNotifications.body.items.some((n: any) => n.type === 'COMMENT_ADDED'),
  ).toBe(true);

  const firstNotifId = ownerNotifications.body.items[0].id as string;

  await request(app.getHttpServer())
    .patch(`/notifications/${firstNotifId}/read`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .expect(200);

  await request(app.getHttpServer())
    .patch('/notifications/read-all')
    .set('Authorization', `Bearer ${ownerToken}`)
    .expect(200);
});
});