import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { DevicesService } from '../devices/devices.service';
import { SmsSendPayload } from '../workers/sms.worker';
import { ShareEntity } from './share.entity';

@Injectable()
export class SharingService {
  constructor(
    @InjectRepository(ShareEntity) private readonly shares: Repository<ShareEntity>,
    @InjectRepository(CaptureEntity) private readonly captures: Repository<CaptureEntity>,
    @InjectQueue('sms') private readonly smsQueue: Queue<SmsSendPayload>,
    private readonly devicesService: DevicesService,
  ) {}

  async queue(
    auth: string,
    dto: { captureId: string; channel: string; destination?: string; idempotencyKey: string },
  ) {
    const device = await this.devicesService.findByToken(auth ?? '');
    if (!device) throw new UnauthorizedException();
    if (device.revokedAt) throw new UnauthorizedException('Device token revoked');
    if (device.tokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Device token expired — re-pair the device');
    }

    const existing = await this.shares.findOne({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) return { shareId: existing.id, status: existing.status };

    const capture = await this.captures.findOne({ where: { id: dto.captureId } });

    const share = this.shares.create({
      captureId: dto.captureId,
      channel: dto.channel,
      destination: dto.destination ?? null,
      idempotencyKey: dto.idempotencyKey,
      status: 'QUEUED',
    });
    const saved = await this.shares.save(share);

    if (dto.channel.toUpperCase() === 'SMS' && dto.destination) {
      await this.smsQueue.add(
        'send-sms',
        {
          shareId: saved.id,
          to: dto.destination,
          captureId: dto.captureId,
          eventId: capture?.eventId ?? 'unknown',
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
    }

    return { shareId: saved.id, status: saved.status };
  }

  async markDelivered(providerMessageId: string): Promise<void> {
    const share = await this.shares.findOne({ where: { providerMessageId } });
    if (!share) return;
    share.status = 'DELIVERED';
    share.deliveredAt = new Date();
    await this.shares.save(share);
  }

  async markFailed(providerMessageId: string, reason: string): Promise<void> {
    const share = await this.shares.findOne({ where: { providerMessageId } });
    if (!share) return;
    share.status = 'FAILED';
    share.error = reason;
    await this.shares.save(share);
  }
}
