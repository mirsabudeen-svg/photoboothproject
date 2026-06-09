import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describeIntegration } from '../test/describe-integration';
import { createTestApp } from '../test/app-factory';

describeIntegration('AnalyticsController (integration)', () => {
  let app: INestApplication;
  let deviceToken: string;

  beforeAll(async () => {
    process.env.PAIRING_CODE = process.env.PAIRING_CODE ?? 'TEST_CODE';
    app = await createTestApp();
    const pair = await request(app.getHttpServer())
      .post('/api/v1/devices/pair')
      .send({ pairingCode: process.env.PAIRING_CODE, deviceName: 'A', deviceModel: 'B' });
    deviceToken = pair.body.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('accepts valid analytics batch', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/analytics/batch')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        events: [{ type: 'session_start', payload: { screen: 'attract' } }],
      });
    expect(res.status).toBe(201);
    expect(res.body.accepted).toBe(1);
  });

  it('accepts empty events array', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/analytics/batch')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ events: [] });
    expect(res.status).toBe(201);
    expect(res.body.accepted).toBe(0);
  });

  it('401 without device token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/analytics/batch')
      .send({ events: [{ type: 'test' }] });
    expect(res.status).toBe(401);
  });
});
