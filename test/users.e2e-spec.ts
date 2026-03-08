import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './setup-e2e';
import { registerUser, loginUser } from './helpers';


describe('Users (e2e)', () => {
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

  it('users/me -> requires jwt and returns current user', async () => {
  const user = await registerUser(app, {
    email: `e2e_me_${Date.now()}_${Math.random()}@example.com`,
    name: 'E2E User',
  });

  const me = await request(app.getHttpServer())
    .get('/users/me')
    .set('Authorization', `Bearer ${user.accessToken}`)
    .expect(200);

  expect(me.body.email).toBe(user.email);
  expect(me.body).toHaveProperty('id');
});

  it('users list -> forbidden for USER, allowed for ADMIN', async () => {
    const normalUser = await registerUser(app, {
      email: `e2e_user_${Date.now()}@example.com`,
      name: 'User',
    });

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${normalUser.accessToken}`)
      .expect(403);

    const adminUser = await registerUser(app, {
      email: `e2e_admin_${Date.now()}@example.com`,
      name: 'Admin',
    });

    const adminId = adminUser.user.id as string;

    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    const adminLogin = await loginUser(app, adminUser.email, adminUser.password);

    const list = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminLogin.accessToken}`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.some((u: any) => u.email === adminUser.email)).toBe(true);
  });
});