import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../devices/device.entity';
import { DevicesService } from '../devices/devices.service';
import { EventEntity } from '../events/event.entity';
import { PosthogService } from '../analytics/posthog.service';
import { MediaProcessorService } from '../media/media-processor.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { CaptureEntity } from './capture.entity';
import { CompleteCaptureDto, CreateCaptureDto } from './dto/create-capture.dto';

const MAX_BYTES = 50 * 1024 * 1024;

const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'video/mp4': [Buffer.from([0x00, 0x00, 0x00])],
};

@Injectable()
export class CapturesService {
  private readonly logger = new Logger(CapturesService.name);

  constructor(
    @InjectRepository(CaptureEntity) private readonly captures: Repository<CaptureEntity>,
    @InjectRepository(EventEntity) private readonly events: Repository<EventEntity>,
    private readonly devicesService: DevicesService,
    private readonly storage: R2StorageService,
    private readonly mediaProcessor: MediaProcessorService,
    private readonly posthog: PosthogService,
  ) {}

  private async assertDevice(auth: string): Promise<Device> {
    const device = await this.devicesService.findByToken(auth ?? '');
    if (!device) throw new UnauthorizedException();
    if (device.revokedAt) throw new UnauthorizedException('Device token revoked');
    if (device.tokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Device token expired — re-pair the device');
    }
    return device;
  }

  private allowedMimeForType(captureType: string): string {
    const normalized = captureType.toLowerCase();
    const map: Record<string, string> = {
      photo: 'image/jpeg',
      photo_strip: 'image/jpeg',
      gif: 'image/gif',
      boomerang: 'image/gif',
      video: 'video/mp4',
      slow_mo: 'video/mp4',
      three_sixty: 'video/mp4',
      dslr_photo: 'image/jpeg',
    };
    return map[normalized] ?? 'image/jpeg';
  }

  private retentionExpiry(eventId: string, event?: EventEntity | null): Date | null {
    const config = event?.config as { retentionDays?: number } | undefined;
    const days = config?.retentionDays ?? 30;
    return new Date(Date.now() + days * 86_400_000);
  }

  async create(auth: string, dto: CreateCaptureDto) {
    await this.assertDevice(auth);
    if (dto.bytes != null && dto.bytes > MAX_BYTES) {
      throw new BadRequestException(`File size ${dto.bytes} exceeds maximum ${MAX_BYTES}`);
    }
    const expectedMime = dto.contentType ?? this.allowedMimeForType(dto.captureType);
    const existing = await this.captures.findOne({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) {
      const uploadUrl = await this.storage.presignPut(existing.objectKey, expectedMime, dto.bytes);
      return { captureId: existing.id, uploadUrl, objectKey: existing.objectKey };
    }
    const event = await this.events.findOne({ where: { id: dto.eventId } });
    const capture = this.captures.create({
      eventId: dto.eventId,
      deviceId: dto.deviceId,
      captureType: dto.captureType,
      idempotencyKey: dto.idempotencyKey,
      objectKey: this.storage.buildObjectKey('default', dto.eventId, dto.idempotencyKey),
      status: 'PENDING',
      expectedMime,
      expiresAt: this.retentionExpiry(dto.eventId, event),
    });
    const saved = await this.captures.save(capture);
    const uploadUrl = await this.storage.presignPut(saved.objectKey, expectedMime, dto.bytes);
    return { captureId: saved.id, uploadUrl, objectKey: saved.objectKey };
  }

  async complete(auth: string, captureId: string, dto: CompleteCaptureDto) {
    const device = await this.assertDevice(auth);
    const capture = await this.captures.findOne({
      where: { id: captureId, idempotencyKey: dto.idempotencyKey },
    });
    if (!capture) throw new NotFoundException('Capture not found');

    if (capture.deviceId !== device.id) {
      throw new ForbiddenException('Capture does not belong to this device');
    }

    if (dto.objectKey !== capture.objectKey) {
      this.logger.warn(
        `objectKey mismatch on capture ${captureId}: got "${dto.objectKey}", expected stored key`,
      );
      throw new BadRequestException('objectKey does not match this capture');
    }

    if (capture.status === 'SYNCED') {
      return {
        captureId: capture.id,
        status: 'SYNCED',
        galleryUrl: this.storage.publicUrl(capture.objectKey),
      };
    }

    const expectedMime = capture.expectedMime ?? 'image/jpeg';
    const head = await this.storage.getRange(dto.objectKey, 0, 15);
    const allowed = MAGIC_BYTES[expectedMime] ?? MAGIC_BYTES['image/jpeg'];
    const valid = allowed.some((magic) => {
      if (expectedMime === 'video/mp4') {
        return head.length >= 8 && head.subarray(4, 8).toString('ascii') === 'ftyp';
      }
      return head.subarray(0, magic.length).equals(magic);
    });

    if (!valid) {
      await this.storage.delete(dto.objectKey).catch(() => {});
      capture.status = 'FAILED';
      await this.captures.save(capture);
      throw new BadRequestException('Uploaded file does not match declared type');
    }

    capture.status = 'SYNCED';
    await this.captures.save(capture);
    this.mediaProcessor.enqueueProcessing(capture.id);
    this.posthog.capture({
      distinctId: capture.eventId,
      event: 'capture_completed',
      properties: {
        captureType: capture.captureType,
        hasAiJob: false,
        eventId: capture.eventId,
      },
    });
    return {
      captureId: capture.id,
      status: 'SYNCED',
      galleryUrl: this.storage.publicUrl(capture.objectKey),
    };
  }
}
