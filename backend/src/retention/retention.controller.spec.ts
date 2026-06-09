import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describeIntegration } from '../test/describe-integration';
import { createTestApp } from '../test/app-factory';

describeIntegration('RetentionController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? 'test-admin-key';
    app = await createTestApp();
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('401 without admin key', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/admin/retention/sweep');
    expect(res.status).toBe(401);
  });

  it('201 triggers retention sweep with admin key', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/retention/sweep')
      .set('x-admin-api-key', process.env.ADMIN_API_KEY!);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      deletedMedia: expect.any(Number),
      deletedShares: expect.any(Number),
      errors: expect.any(Number),
    });
  });
});
