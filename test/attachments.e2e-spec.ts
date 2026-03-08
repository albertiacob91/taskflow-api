import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-e2e';
import { createProject, createTask, registerUser } from './helpers';

describe('Attachments (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('attachments -> upload -> list -> delete', async () => {
    const user = await registerUser(app, {
      email: `e2e_attach_${Date.now()}@example.com`,
      name: 'Attach User',
    });

    const project = await createProject(app, user.accessToken, {
      name: 'Attachment Project',
      description: 'attachments test',
    });

    const task = await createTask(app, user.accessToken, project.projectId, {
      title: 'Attachment Task',
    });

    const upload = await request(app.getHttpServer())
      .post(`/tasks/${task.taskId}/attachments`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .attach('file', Buffer.from('hello attachment'), 'note.txt')
      .expect(201);

    expect(upload.body).toHaveProperty('id');
    expect(upload.body.originalName).toBe('note.txt');

    const attachmentId = upload.body.id as string;

    const list = await request(app.getHttpServer())
      .get(`/tasks/${task.taskId}/attachments`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.some((a: any) => a.id === attachmentId)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    const listAfter = await request(app.getHttpServer())
      .get(`/tasks/${task.taskId}/attachments`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(listAfter.body.some((a: any) => a.id === attachmentId)).toBe(false);
  });
});