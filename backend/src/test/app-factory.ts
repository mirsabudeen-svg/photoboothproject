import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PosthogService } from '../analytics/posthog.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { SmsService } from '../sms/sms.service';

const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  client: Promise.resolve({ ping: jest.fn().mockResolvedValue('PONG') }),
  getWaitingCount: jest.fn().mockResolvedValue(0),
  getActiveCount: jest.fn().mockResolvedValue(0),
  getFailedCount: jest.fn().mockResolvedValue(0),
};

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SmsService)
    .useValue({
      send: jest.fn().mockResolvedValue('SM_test_sid'),
      isConfigured: jest.fn().mockReturnValue(true),
    })
    .overrideProvider(PosthogService)
    .useValue({ capture: jest.fn() })
    .overrideProvider(getQueueToken('sms'))
    .useValue(mockQueue)
    .overrideProvider(R2StorageService)
    .useValue({
      presignPut: jest.fn().mockResolvedValue('https://r2.example.com/test-presign'),
      getRange: jest.fn().mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff, 0xe0])),
      delete: jest.fn().mockResolvedValue(undefined),
      getObject: jest.fn().mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff])),
      putObject: jest.fn().mockResolvedValue(undefined),
      publicUrl: jest.fn((key: string) => `https://cdn.example.com/${key}`),
      buildObjectKey: jest.fn(
        (_t: string, eventId: string, key: string) => `tenant/default/event/${eventId}/capture/${key}/file.jpg`,
      ),
      variantKey: jest.fn((base: string, suffix: string) => `${base}_${suffix}`),
    })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();
  return app;
}
