import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './setup-e2e';
import { createProject, registerUser } from './helpers';

describe('Activity (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('activity api -> supports my activity and admin user activity', async () => {
    const user = await registerUser(app, {
      email: `e2e_activity_api_${Date.now()}@example.com`,
      name: 'Activity API User',
    });

    const project = await createProject(app, user.accessToken, {
      name: 'Activity API Project',
      description: 'activity api test',
    });

    const projectId = project.projectId;
    const userId = user.user.id as string;

    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Activity API Task',
        projectId,
        status: 'TODO',
        priority: 'MEDIUM',
      })
      .expect(201);

    const myActivity = await request(app.getHttpServer())
      .get('/activity?page=1&limit=20')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(myActivity.body.items)).toBe(true);
    expect(myActivity.body.items.some((x: any) => x.actorId === userId)).toBe(
      true,
    );

    const admin = await registerUser(app, {
      email: `e2e_activity_admin_${Date.now()}@example.com`,
      name: 'Admin',
    });

    await prisma.user.update({
      where: { id: admin.user.id },
      data: { role: 'ADMIN' },
    });

    const userActivity = await request(app.getHttpServer())
      .get(`/users/${userId}/activity?page=1&limit=20`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(Array.isArray(userActivity.body.items)).toBe(true);
    expect(userActivity.body.items.some((x: any) => x.actorId === userId)).toBe(
      true,
    );

    await request(app.getHttpServer())
      .get(`/users/${userId}/activity?page=1&limit=20`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(403);

    const projectActivity = await request(app.getHttpServer())
      .get(`/projects/${projectId}/activity?page=1&limit=20`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(projectActivity.body.items)).toBe(true);
  });

  it('project activity -> returns logs for project actions', async () => {
    const user = await registerUser(app, {
      email: `e2e_activity_${Date.now()}@example.com`,
      name: 'Activity User',
    });

    const createdProject = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Activity Project', description: 'Project for activity logs' })
      .expect(201);

    const projectId = createdProject.body.id as string;

    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Activity Task',
        description: 'Task for activity logs',
        projectId,
        status: 'TODO',
        priority: 'MEDIUM',
      })
      .expect(201);

    const activity = await request(app.getHttpServer())
      .get(`/projects/${projectId}/activity?page=1&limit=20`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(activity.body.items)).toBe(true);

    const types = activity.body.items.map((x: any) => x.type);

    expect(types).toContain('PROJECT_CREATED');
    expect(types).toContain('TASK_CREATED');
  });
});