import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { PosthogService } from '../analytics/posthog.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { ShareEntity } from '../sharing/share.entity';
import { SmsService } from '../sms/sms.service';

export interface SmsSendPayload {
  shareId: string;
  to: string;
  captureId: string;
  eventId: string;
}

@Injectable()
@Processor('sms', {
  concurrency: 3,
  limiter: { max: 3, duration: 1000 },
})
export class SmsWorker extends WorkerHost {
  private readonly logger = new Logger(SmsWorker.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly storage: R2StorageService,
    private readonly posthog: PosthogService,
    @InjectRepository(ShareEntity) private readonly shares: Repository<ShareEntity>,
    @InjectRepository(CaptureEntity) private readonly captures: Repository<CaptureEntity>,
  ) {
    super();
  }

  async process(job: Job<SmsSendPayload>): Promise<void> {
    const { shareId, to, captureId, eventId } = job.data;
    const startedAt = Date.now();

    await this.shares.update(shareId, { status: 'PROCESSING' });

    const capture = await this.captures.findOne({ where: { id: captureId } });
    if (!capture) {
      throw new Error('Capture not found');
    }

    const mediaUrl = capture.webpKey
      ? this.storage.publicUrl(capture.webpKey)
      : capture.objectKey
        ? this.storage.publicUrl(capture.objectKey)
        : undefined;
    const body = "Here's your photo! Tap to view and download.";

    const sid = await this.smsService.send(to, body, mediaUrl);
    await this.shares.update(shareId, {
      status: 'SENT',
      providerMessageId: sid,
      sentAt: new Date(),
      error: null,
    });

    const share = await this.shares.findOne({ where: { id: shareId } });
    if (share) {
      this.posthog.capture({
        distinctId: eventId,
        event: 'share_delivered',
        properties: {
          channel: 'sms',
          eventId,
          deliveryTimeMs: Date.now() - (share.createdAt?.getTime() ?? startedAt),
          retryCount: job.attemptsMade,
        },
      });
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<SmsSendPayload>, error: Error): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      this.logger.warn(`SMS job ${job.id} failed after ${job.attemptsMade} attempts`);
      await this.shares.update(job.data.shareId, {
        status: 'FAILED',
        error: error.message,
      });
    }
  }
}
