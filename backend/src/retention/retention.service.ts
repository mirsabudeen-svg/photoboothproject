import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, Repository } from 'typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { R2StorageService } from '../storage/r2-storage.service';
import { ShareEntity } from '../sharing/share.entity';

export interface RetentionReport {
  deletedMedia: number;
  deletedShares: number;
  errors: number;
}

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    @InjectRepository(CaptureEntity) private readonly captures: Repository<CaptureEntity>,
    @InjectRepository(ShareEntity) private readonly shares: Repository<ShareEntity>,
    private readonly storage: R2StorageService,
  ) {}

  async runRetentionSweep(): Promise<RetentionReport> {
    const report: RetentionReport = { deletedMedia: 0, deletedShares: 0, errors: 0 };
    const batchSize = 100;
    let offset = 0;

    while (true) {
      const expired = await this.captures.find({
        where: { expiresAt: LessThan(new Date()), status: Not('deleted') },
        take: batchSize,
        skip: offset,
        select: ['id', 'objectKey', 'thumbKey', 'webpKey', 'printKey'],
      });
      if (expired.length === 0) break;

      for (const capture of expired) {
        try {
          const keys = [capture.objectKey, capture.thumbKey, capture.webpKey, capture.printKey].filter(
            (k): k is string => Boolean(k),
          );
          await Promise.all(keys.map((k) => this.storage.delete(k).catch(() => {})));

          await this.shares.update(
            { captureId: capture.id },
            { destination: null, status: 'deleted', deletedAt: new Date() },
          );

          await this.captures.update(capture.id, {
            status: 'deleted',
            objectKey: undefined,
            thumbKey: null,
            webpKey: null,
            printKey: null,
            deletedAt: new Date(),
          });

          report.deletedMedia++;
          report.deletedShares++;
        } catch (e) {
          this.logger.error(`Retention sweep error for capture ${capture.id}`, e);
          report.errors++;
        }
      }
      offset += batchSize;
    }

    this.logger.log(`Retention sweep complete: ${JSON.stringify(report)}`);
    return report;
  }
}
