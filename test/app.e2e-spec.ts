import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TaskFlow API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    await app.close();
  });

  it('register -> returns accessToken', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'Password123!',
        name: 'E2E User',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(email);
  });

  it('users/me -> requires jwt and returns current user', async () => {
    const email = `e2e_${Date.now()}@example.com`;

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'Password123!',
        name: 'E2E User',
      })
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
      .send({
        email,
        password: 'Password123!',
        name: 'E2E Project User',
      })
      .expect(201);

    const token = register.body.accessToken as string;

    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Project A', description: 'Desc A' })
      .expect(201);

    expect(created.body).toHaveProperty('id');
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
});