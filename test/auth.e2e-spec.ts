import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './setup-e2e';
import { registerUser } from './helpers';

describe('Auth (e2e)', () => {
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

  it('auth login -> rate limit returns 429 after too many requests', async () => {
    const { email, password } = await registerUser(app, {
      email: `e2e_rate_${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Rate User',
    });

    let lastStatus = 0;

    for (let i = 0; i < 12; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password });

      lastStatus = res.status;

      if (res.status === 429) break;
    }

    expect(lastStatus).toBe(429);
  });
});