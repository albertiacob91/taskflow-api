import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-e2e';
import { createProject, createTask, registerUser } from './helpers';

describe('Projects (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('projects -> create -> list -> update -> delete (owner)', async () => {
    const user = await registerUser(app, {
      email: `e2e_proj_${Date.now()}@example.com`,
      name: 'E2E Project User',
    });

    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Project A', description: 'Desc A' })
      .expect(201);

    const projectId = created.body.id as string;

    const list1 = await request(app.getHttpServer())
      .get('/projects?page=1&limit=10')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(Array.isArray(list1.body.items)).toBe(true);
    expect(list1.body.items.some((p: any) => p.id === projectId)).toBe(true);

    const updated = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Project A (updated)' })
      .expect(200);

    expect(updated.body.name).toBe('Project A (updated)');

    const deleted = await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(deleted.body).toEqual({ ok: true });

    const list2 = await request(app.getHttpServer())
      .get('/projects?page=1&limit=10')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    expect(list2.body.items.some((p: any) => p.id === projectId)).toBe(false);
  });

  it('projects members -> owner can add/remove, member can view, outsider forbidden', async () => {
    const owner = await registerUser(app, {
      email: `e2e_owner_${Date.now()}@example.com`,
      name: 'Owner',
    });

    const member = await registerUser(app, {
      email: `e2e_member_${Date.now()}@example.com`,
      name: 'Member',
    });

    const outsider = await registerUser(app, {
      email: `e2e_out_${Date.now()}@example.com`,
      name: 'Outsider',
    });

    const project = await createProject(app, owner.accessToken, {
      name: 'Members Project',
      description: 'Project members e2e',
    });

    const projectId = project.projectId;

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: member.email })
      .expect(201);

    const listAsMember = await request(app.getHttpServer())
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(200);

    expect(listAsMember.body).toHaveProperty('owner');
    expect(Array.isArray(listAsMember.body.members)).toBe(true);
    expect(
      listAsMember.body.members.some((u: any) => u.email === member.email),
    ).toBe(true);

    await request(app.getHttpServer())
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/projects/${projectId}/members/${member.user.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(403);

    const listProjectsAfter = await request(app.getHttpServer())
      .get('/projects?page=1&limit=50')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .expect(200);

    expect(
      listProjectsAfter.body.items.some((p: any) => p.id === projectId),
    ).toBe(false);
  });

  it('project roles -> viewer can read but cannot write', async () => {
    const owner = await registerUser(app, {
      email: `e2e_viewer_owner_${Date.now()}@example.com`,
      name: 'Owner',
    });

    const viewer = await registerUser(app, {
      email: `e2e_viewer_${Date.now()}@example.com`,
      name: 'Viewer',
    });

    const project = await createProject(app, owner.accessToken, {
      name: 'Viewer Project',
      description: 'viewer role test',
    });

    const projectId = project.projectId;

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: viewer.email, role: 'VIEWER' })
      .expect(201);

    const listProjects = await request(app.getHttpServer())
      .get('/projects?page=1&limit=20')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(listProjects.body.items.some((p: any) => p.id === projectId)).toBe(
      true,
    );

    const task = await createTask(app, owner.accessToken, projectId, {
      title: 'Viewer Visible Task',
    });

    const listTasks = await request(app.getHttpServer())
      .get(`/tasks?projectId=${projectId}&page=1&limit=20`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(listTasks.body.items.some((t: any) => t.id === task.taskId)).toBe(
      true,
    );

    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({
        title: 'Viewer Cannot Create',
        projectId,
        status: 'TODO',
        priority: 'MEDIUM',
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({ content: 'No write', taskId: task.taskId })
      .expect(403);

    await request(app.getHttpServer())
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);
  });
});