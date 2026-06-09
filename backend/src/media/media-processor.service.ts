import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import sharp from 'sharp';
import { CaptureEntity } from '../captures/capture.entity';
import { R2StorageService } from '../storage/r2-storage.service';

export interface ProcessedVariants {
  webpKey: string;
  thumbKey: string;
  printKey: string;
}

@Injectable()
export class MediaProcessorService {
  private readonly logger = new Logger(MediaProcessorService.name);

  constructor(
    @InjectRepository(CaptureEntity) private readonly captures: Repository<CaptureEntity>,
    private readonly storage: R2StorageService,
  ) {}

  async processCaptureBuffer(sourceBuffer: Buffer, baseKey: string): Promise<ProcessedVariants> {
    const webpKey = this.storage.variantKey(baseKey, 'web').replace(/\.jpg$/i, '.webp');
    const thumbKey = this.storage.variantKey(baseKey, 'thumb').replace(/\.jpg$/i, '.webp');
    const printKey = this.storage.variantKey(baseKey, 'print');

    const [webp, thumb, print] = await Promise.all([
      sharp(sourceBuffer)
        .rotate()
        .resize({ width: 1080, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer(),
      sharp(sourceBuffer)
        .rotate()
        .resize({ width: 400, height: 400, fit: 'cover' })
        .webp({ quality: 70 })
        .toBuffer(),
      sharp(sourceBuffer)
        .rotate()
        .resize({ width: 1800, height: 1200, fit: 'contain', background: '#1A1A1A' })
        .jpeg({ quality: 95 })
        .toBuffer(),
    ]);

    await Promise.all([
      this.storage.putObject(webpKey, webp, 'image/webp'),
      this.storage.putObject(thumbKey, thumb, 'image/webp'),
      this.storage.putObject(printKey, print, 'image/jpeg'),
    ]);

    return { webpKey, thumbKey, printKey };
  }

  enqueueProcessing(captureId: string): void {
    setImmediate(() => {
      this.processCaptureById(captureId).catch((error) => {
        this.logger.error(`Media processing failed for ${captureId}: ${error.message}`);
      });
    });
  }

  private async processCaptureById(captureId: string): Promise<void> {
    const capture = await this.captures.findOne({ where: { id: captureId } });
    if (!capture?.objectKey) return;

    const source = await this.storage.getObject(capture.objectKey);
    const variants = await this.processCaptureBuffer(source, capture.objectKey);

    capture.webpKey = variants.webpKey;
    capture.thumbKey = variants.thumbKey;
    capture.printKey = variants.printKey;
    await this.captures.save(capture);
  }
}
