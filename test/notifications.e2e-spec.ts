import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-e2e';
import { createProject, registerUser } from './helpers';

describe('Notifications (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('notifications -> task assigned and comment added', async () => {
    const owner = await registerUser(app, {
      email: `e2e_notif_owner_${Date.now()}@example.com`,
      name: 'Owner',
    });

    const member = await registerUser(app, {
      email: `e2e_notif_member_${Date.now()}@example.com`,
      name: 'Member',
    });

    const project = await createProject(app, owner.accessToken, {
      name: 'Notifications Project',
      description: 'notifications test',
    });

    const projectId = project.projectId;

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: member.email })
      .expect(201);

    const task = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Notifications Task',
        projectId,
        status: 'TODO',
        priority: 'MEDIUM',
        assignedToId: member.user.id,
      })
      .expect(201);

    const taskId = task.body.id as string;

    const memberNotifications1 = await request(app.getHttpServer())
      .get('/notifications?page=1&limit=20')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(200);

    expect(Array.isArray(memberNotifications1.body.items)).toBe(true);
    expect(
      memberNotifications1.body.items.some(
        (n: any) => n.type === 'TASK_ASSIGNED',
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ content: 'Hello owner', taskId })
      .expect(201);

    const ownerNotifications = await request(app.getHttpServer())
      .get('/notifications?page=1&limit=20')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(
      ownerNotifications.body.items.some(
        (n: any) => n.type === 'COMMENT_ADDED',
      ),
    ).toBe(true);

    const firstNotifId = ownerNotifications.body.items[0].id as string;

    await request(app.getHttpServer())
      .patch(`/notifications/${firstNotifId}/read`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch('/notifications/read-all')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
  });
});