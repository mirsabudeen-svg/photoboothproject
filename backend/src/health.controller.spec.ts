import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getDataSourceToken } from '@nestjs/typeorm';
import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let app: INestApplication;
  let queryMock: jest.Mock;

  beforeEach(async () => {
    queryMock = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getDataSourceToken(),
          useValue: { query: queryMock },
        },
        {
          provide: getQueueToken('sms'),
          useValue: {
            client: Promise.resolve({ ping: jest.fn().mockResolvedValue('PONG') }),
            getWaitingCount: jest.fn().mockResolvedValue(0),
            getActiveCount: jest.fn().mockResolvedValue(0),
            getFailedCount: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns ok with db ping and queue metrics', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('ok');
    expect(res.body.queues.sms.waiting).toBe(0);
    expect(res.body.redis).toBe('ok');
    expect(res.body.version).toBeDefined();
  });

  it('GET /health returns 503 when DB unreachable', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection refused'));
    const controller = app.get(HealthController);
    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
