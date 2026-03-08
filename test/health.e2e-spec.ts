import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup-e2e';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('health -> returns ok and sets x-request-id header', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body).toEqual({ ok: true });
    expect(res.headers).toHaveProperty('x-request-id');
  });
});