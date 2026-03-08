import { INestApplication } from '@nestjs/common';
import request from 'supertest';

type RegisterOverrides = {
  email?: string;
  password?: string;
  name?: string;
};

type ProjectOverrides = {
  name?: string;
  description?: string;
};

type TaskOverrides = {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  dueDate?: string;
};

export async function registerUser(
  app: INestApplication,
  overrides: RegisterOverrides = {},
) {
  const email =
  overrides.email ??
  `e2e_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = overrides.password ?? 'Password123!';
  const name = overrides.name ?? 'E2E User';

  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password, name })
    .expect(201);

  return {
    email,
    password,
    name,
    accessToken: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
    user: res.body.user,
    response: res,
  };
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password = 'Password123!',
) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);

  return {
    accessToken: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
    user: res.body.user,
    response: res,
  };
}

export async function createProject(
  app: INestApplication,
  token: string,
  overrides: ProjectOverrides = {},
) {
  const payload = {
    name: overrides.name ?? 'Project A',
    description: overrides.description ?? 'Project description',
  };

  const res = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send(payload)
    .expect(201);

  return {
    project: res.body,
    projectId: res.body.id as string,
    response: res,
  };
}

export async function createTask(
  app: INestApplication,
  token: string,
  projectId: string,
  overrides: TaskOverrides = {},
) {
  const payload = {
    title: overrides.title ?? 'Task 1',
    description: overrides.description ?? 'Task description',
    projectId,
    status: overrides.status ?? 'TODO',
    priority: overrides.priority ?? 'MEDIUM',
    assignedToId: overrides.assignedToId,
    dueDate: overrides.dueDate,
  };

  const res = await request(app.getHttpServer())
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send(payload)
    .expect(201);

  return {
    task: res.body,
    taskId: res.body.id as string,
    response: res,
  };
}