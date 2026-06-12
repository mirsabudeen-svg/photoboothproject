import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describeIntegration } from '../test/describe-integration';
import { createTestApp } from '../test/app-factory';

describeIntegration('EventsController (integration)', () => {
  let app: INestApplication;
  const adminHeaders = () => ({ 'x-admin-api-key': process.env.ADMIN_API_KEY! });
  let deviceToken: string;

  beforeAll(async () => {
    process.env.PAIRING_CODE = process.env.PAIRING_CODE ?? 'TEST_CODE';
    process.env.ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? 'test-admin-api-key-32-chars-min!';
    app = await createTestApp();
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/devices/pair')
      .send({
        pairingCode: process.env.PAIRING_CODE,
        deviceName: 'Test',
        deviceModel: 'Test',
      });
    deviceToken = res.body.accessToken;
  });

  describe('POST /events', () => {
    it('201 — creates event with valid payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .set(adminHeaders())
        .send({
          name: 'Test Wedding',
          eventType: 'WEDDING',
          config: {
            theme: 'luxury_gold',
            captureMode: 'photo',
            consentText: 'I consent to my photos being taken and shared as part of this event.',
            shareChannels: ['qr', 'sms'],
            retentionDays: 30,
          },
        });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.isActive).toBe(true);
    });

    it('401 — rejects request without admin key', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .send({ name: 'Test' });
      expect(res.status).toBe(401);
    });

    it('400 — rejects event name too short', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .set(adminHeaders())
        .send({
          name: 'AB',
          config: {
            consentText: 'x'.repeat(20),
            shareChannels: ['qr'],
            retentionDays: 30,
          },
        });
      expect(res.status).toBe(400);
    });

    it('400 — rejects invalid retentionDays', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .set(adminHeaders())
        .send({
          name: 'Valid Name',
          config: { retentionDays: 999, shareChannels: ['qr'], consentText: 'x'.repeat(20) },
        });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /events/:id/config', () => {
    it('200 — returns config with valid device token', async () => {
      const { body: event } = await request(app.getHttpServer())
        .post('/api/v1/events')
        .set(adminHeaders())
        .send({
          name: 'Config Test Event',
          config: {
            theme: 'luxury_gold',
            consentText: 'x'.repeat(20),
            shareChannels: ['qr'],
            retentionDays: 30,
          },
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/events/${event.id}/config`)
        .set('Authorization', `Bearer ${deviceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.config.theme).toBe('luxury_gold');
    });

    it('401 — rejects request without device token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/events/some-id/config');
      expect(res.status).toBe(401);
    });
  });
});
