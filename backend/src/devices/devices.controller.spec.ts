import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describeIntegration } from '../test/describe-integration';
import { createTestApp } from '../test/app-factory';

describeIntegration('DevicesController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.PAIRING_CODE = process.env.PAIRING_CODE ?? 'TEST_CODE';
    process.env.ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? 'test-admin-key';
    app = await createTestApp();
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('POST /devices/pair', () => {
    it('201 — issues device token with valid pairing code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/devices/pair')
        .send({
          pairingCode: process.env.PAIRING_CODE,
          deviceName: 'Samsung Tab A9+',
          deviceModel: 'Samsung Tab A9+',
          appVersion: '1.0.0',
          osVersion: '14',
        });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toMatch(/^[a-f0-9]{64}$/);
      expect(res.body.deviceId).toBeDefined();
      expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('401 — rejects invalid pairing code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/devices/pair')
        .send({ pairingCode: 'WRONG_CODE', deviceName: 'Test', deviceModel: 'Test' });
      expect(res.status).toBe(401);
    });

    it('400 — rejects missing deviceModel field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/devices/pair')
        .send({ pairingCode: process.env.PAIRING_CODE, deviceName: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /devices/token/refresh', () => {
    it('200 — refreshes token for valid device', async () => {
      const pairRes = await request(app.getHttpServer())
        .post('/api/v1/devices/pair')
        .send({
          pairingCode: process.env.PAIRING_CODE,
          deviceName: 'Refresh Test',
          deviceModel: 'Test',
        });
      const { accessToken } = pairRes.body;

      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/devices/token/refresh')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(refreshRes.status).toBe(201);
      expect(refreshRes.body.accessToken).not.toBe(accessToken);
      expect(refreshRes.body.expiresAt).toBeDefined();
    });

    it('401 — rejects request without token', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/devices/token/refresh');
      expect(res.status).toBe(401);
    });
  });
});
