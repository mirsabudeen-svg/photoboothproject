import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CaptureEntity } from './capture.entity';
import { CapturesService } from './captures.service';
import { EventEntity } from '../events/event.entity';
import { DevicesService } from '../devices/devices.service';
import { PosthogService } from '../analytics/posthog.service';
import { MediaProcessorService } from '../media/media-processor.service';
import { R2StorageService } from '../storage/r2-storage.service';

describe('CapturesService', () => {
  let service: CapturesService;
  let storage: { presignPut: jest.Mock; getRange: jest.Mock; delete: jest.Mock; publicUrl: jest.Mock; buildObjectKey: jest.Mock };
  let capturesRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };

  const device = {
    id: 'dev-1',
    tokenExpiresAt: new Date(Date.now() + 86_400_000),
  };

  beforeEach(async () => {
    storage = {
      presignPut: jest.fn().mockResolvedValue('https://presign'),
      getRange: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      publicUrl: jest.fn((k: string) => `https://cdn/${k}`),
      buildObjectKey: jest.fn(() => 'obj/key.jpg'),
    };
    capturesRepo = {
      findOne: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ ...v, id: 'cap-1' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CapturesService,
        { provide: getRepositoryToken(CaptureEntity), useValue: capturesRepo },
        { provide: getRepositoryToken(EventEntity), useValue: { findOne: jest.fn().mockResolvedValue({ config: { retentionDays: 30 } }) } },
        { provide: DevicesService, useValue: { findByToken: jest.fn().mockResolvedValue(device) } },
        { provide: R2StorageService, useValue: storage },
        { provide: MediaProcessorService, useValue: { enqueueProcessing: jest.fn() } },
        { provide: PosthogService, useValue: { capture: jest.fn() } },
      ],
    }).compile();

    service = module.get(CapturesService);
  });

  it('400 when bytes exceed 50MB on presign', async () => {
    await expect(
      service.create('Bearer tok', {
        eventId: '00000000-0000-4000-8000-000000000001',
        captureType: 'photo',
        idempotencyKey: '00000000-0000-4000-8000-000000000002',
        deviceId: '00000000-0000-4000-8000-000000000003',
        bytes: 60_000_000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('400 when complete receives PDF magic bytes', async () => {
    capturesRepo.findOne.mockResolvedValue({
      id: 'cap-1',
      idempotencyKey: 'key-1',
      expectedMime: 'image/jpeg',
      objectKey: 'obj.jpg',
      deviceId: 'dev-1',
      status: 'PENDING',
    });
    storage.getRange.mockResolvedValue(Buffer.from('%PDF-1.4'));

    await expect(
      service.complete('Bearer tok', 'cap-1', { idempotencyKey: 'key-1', objectKey: 'obj.jpg' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.delete).toHaveBeenCalledWith('obj.jpg');
  });

  it('200 when complete receives valid JPEG magic bytes', async () => {
    capturesRepo.findOne.mockResolvedValue({
      id: 'cap-1',
      idempotencyKey: 'key-1',
      expectedMime: 'image/jpeg',
      objectKey: 'obj.jpg',
      deviceId: 'dev-1',
      status: 'PENDING',
    });
    storage.getRange.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff, 0xe0]));

    const result = await service.complete('Bearer tok', 'cap-1', {
      idempotencyKey: 'key-1',
      objectKey: 'obj.jpg',
    });
    expect(result.status).toBe('SYNCED');
  });

  it('rejects completion with a foreign objectKey', async () => {
    capturesRepo.findOne.mockResolvedValue({
      id: 'cap-1',
      idempotencyKey: 'key-1',
      expectedMime: 'image/jpeg',
      objectKey: 'obj.jpg',
      deviceId: 'dev-1',
      status: 'PENDING',
    });

    await expect(
      service.complete('Bearer tok', 'cap-1', {
        idempotencyKey: 'key-1',
        objectKey: 'events/other/evil.jpg',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects completion by a different device', async () => {
    capturesRepo.findOne.mockResolvedValue({
      id: 'cap-1',
      idempotencyKey: 'key-1',
      expectedMime: 'image/jpeg',
      objectKey: 'obj.jpg',
      deviceId: 'dev-2',
      status: 'PENDING',
    });

    await expect(
      service.complete('Bearer tok', 'cap-1', {
        idempotencyKey: 'key-1',
        objectKey: 'obj.jpg',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
