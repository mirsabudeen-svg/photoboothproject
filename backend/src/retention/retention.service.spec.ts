import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { ShareEntity } from '../sharing/share.entity';
import { R2StorageService } from '../storage/r2-storage.service';
import { RetentionService } from './retention.service';

describe('RetentionService', () => {
  let service: RetentionService;
  let capturesRepo: jest.Mocked<Partial<Repository<CaptureEntity>>>;
  let sharesRepo: jest.Mocked<Partial<Repository<ShareEntity>>>;
  let storage: { delete: jest.Mock };

  beforeEach(async () => {
    capturesRepo = {
      find: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    sharesRepo = {
      update: jest.fn().mockResolvedValue(undefined),
    };
    storage = { delete: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionService,
        { provide: getRepositoryToken(CaptureEntity), useValue: capturesRepo },
        { provide: getRepositoryToken(ShareEntity), useValue: sharesRepo },
        { provide: R2StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get(RetentionService);
  });

  it('deletes R2 objects for expired captures', async () => {
    (capturesRepo.find as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'cap-1',
          objectKey: 'obj-1',
          thumbKey: 'thumb-1',
          webpKey: null,
          printKey: null,
        } as CaptureEntity,
        {
          id: 'cap-2',
          objectKey: 'obj-2',
          thumbKey: null,
          webpKey: 'webp-2',
          printKey: null,
        } as CaptureEntity,
      ])
      .mockResolvedValueOnce([]);

    const report = await service.runRetentionSweep();

    expect(storage.delete).toHaveBeenCalledWith('obj-1');
    expect(storage.delete).toHaveBeenCalledWith('thumb-1');
    expect(storage.delete).toHaveBeenCalledWith('obj-2');
    expect(storage.delete).toHaveBeenCalledWith('webp-2');
    expect(capturesRepo.update).toHaveBeenCalledTimes(2);
    expect(report.deletedMedia).toBe(2);
    expect(report.errors).toBe(0);
  });

  it('handles R2 delete failure gracefully without stopping sweep', async () => {
    (capturesRepo.update as jest.Mock)
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValue(undefined);
    (capturesRepo.find as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'cap-1',
          objectKey: 'obj-1',
          thumbKey: null,
          webpKey: null,
          printKey: null,
        } as CaptureEntity,
        {
          id: 'cap-2',
          objectKey: 'obj-2',
          thumbKey: null,
          webpKey: null,
          printKey: null,
        } as CaptureEntity,
      ])
      .mockResolvedValueOnce([]);

    const report = await service.runRetentionSweep();

    expect(report.errors).toBeGreaterThan(0);
    expect(capturesRepo.update).toHaveBeenCalledTimes(2);
  });
});
