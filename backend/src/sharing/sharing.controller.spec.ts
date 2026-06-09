import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describeIntegration } from '../test/describe-integration';
import { createTestApp } from '../test/app-factory';

describeIntegration('SharingController (integration)', () => {
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

  it('400 when captureId is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/shares')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ channel: 'sms', idempotencyKey: '00000000-0000-4000-8000-000000000001' });
    expect(res.status).toBe(400);
  });

  it('400 when channel is invalid', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/shares')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        captureId: '00000000-0000-4000-8000-000000000001',
        channel: 'INVALID',
        idempotencyKey: '00000000-0000-4000-8000-000000000002',
      });
    expect(res.status).toBe(400);
  });
});
