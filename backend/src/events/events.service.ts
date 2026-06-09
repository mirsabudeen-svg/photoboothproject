import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { Device } from '../devices/device.entity';
import { ShareEntity } from '../sharing/share.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { EventEntity } from './event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity) private readonly events: Repository<EventEntity>,
    @InjectRepository(CaptureEntity) private readonly captures: Repository<CaptureEntity>,
    @InjectRepository(ShareEntity) private readonly shares: Repository<ShareEntity>,
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    private readonly config: ConfigService,
  ) {}

  async findById(eventId: string): Promise<EventEntity> {
    const event = await this.events.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async getConfig(eventId: string) {
    const event = await this.events.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    return {
      eventId: event.id,
      eventName: event.name,
      eventType: event.eventType,
      config: event.config,
      serverVersion: Number(event.serverVersion),
    };
  }

  async list() {
    return this.events.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateEventDto) {
    const config = dto.config as unknown as Record<string, unknown>;
    const retentionDays = (config.retentionDays as number | undefined) ?? 30;
    const galleryToken = randomBytes(6).toString('hex');
    const event = this.events.create({
      name: dto.name,
      eventType: dto.eventType ?? 'WEDDING',
      config,
      serverVersion: '1',
      isActive: true,
      galleryToken,
      galleryPublishedAt: null,
      galleryExpiresAt: new Date(Date.now() + retentionDays * 86_400_000),
    });
    return this.events.save(event);
  }

  async publishGallery(eventId: string): Promise<{ event: EventEntity; galleryUrl: string }> {
    const event = await this.findById(eventId);
    event.galleryPublishedAt = new Date();
    const saved = await this.events.save(event);
    const baseUrl = this.config.get<string>('APP_BASE_URL', 'http://localhost:3001');
    const galleryUrl = `${baseUrl}/gallery/${saved.id}?token=${saved.galleryToken}`;
    return { event: saved, galleryUrl };
  }

  async unpublishGallery(eventId: string): Promise<void> {
    const event = await this.findById(eventId);
    event.galleryPublishedAt = null;
    event.galleryToken = randomBytes(6).toString('hex');
    await this.events.save(event);
  }

  async getStats(eventId: string) {
    const event = await this.events.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    const [captureCount, shareCount] = await Promise.all([
      this.captures.count({ where: { eventId } }),
      this.shares
        .createQueryBuilder('share')
        .innerJoin(CaptureEntity, 'capture', 'capture.id = share.captureId')
        .where('capture.eventId = :eventId', { eventId })
        .getCount(),
    ]);
    return { eventId, captureCount, shareCount };
  }

  async getDetail(eventId: string) {
    const event = await this.events.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const [captures, shares, devices, recentCaptures, shareRows] = await Promise.all([
      this.captures.count({ where: { eventId, status: 'SYNCED' } }),
      this.shares
        .createQueryBuilder('share')
        .innerJoin(CaptureEntity, 'capture', 'capture.id = share.captureId')
        .where('capture.eventId = :eventId', { eventId })
        .getCount(),
      this.devices.find({ where: { currentEventId: eventId }, order: { lastSeenAt: 'DESC' } }),
      this.captures.find({
        where: { eventId },
        order: { createdAt: 'DESC' },
        take: 12,
        select: ['id', 'thumbKey', 'objectKey', 'captureType', 'createdAt', 'status'],
      }),
      this.shares
        .createQueryBuilder('share')
        .select('share.channel', 'channel')
        .addSelect('share.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .innerJoin(CaptureEntity, 'capture', 'capture.id = share.captureId')
        .where('capture.eventId = :eventId', { eventId })
        .groupBy('share.channel')
        .addGroupBy('share.status')
        .getRawMany<{ channel: string; status: string; count: string }>(),
    ]);

    const shareBreakdown: Record<string, number> = {};
    const shareStatusBreakdown: Record<string, { sent: number; delivered: number; failed: number }> = {};
    for (const row of shareRows) {
      shareBreakdown[row.channel] = (shareBreakdown[row.channel] ?? 0) + Number(row.count);
      const bucket = shareStatusBreakdown[row.channel] ?? { sent: 0, delivered: 0, failed: 0 };
      const status = row.status?.toUpperCase() ?? '';
      if (status === 'DELIVERED') bucket.delivered += Number(row.count);
      else if (status === 'FAILED') bucket.failed += Number(row.count);
      else bucket.sent += Number(row.count);
      shareStatusBreakdown[row.channel] = bucket;
    }

    const config = event.config as { retentionDays?: number };
    const retentionDays = config.retentionDays ?? 30;
    const pendingDeletion = await this.captures.count({
      where: { eventId },
    });

    const baseUrl = this.config.get<string>('APP_BASE_URL', 'http://localhost:3001');
    const galleryUrl = event.galleryPublishedAt
      ? `${baseUrl}/gallery/${event.id}?token=${event.galleryToken}`
      : null;

    return {
      event: {
        ...event,
        galleryUrl,
      },
      stats: {
        captures,
        shares,
        sessions: 0,
        leads: 0,
      },
      devices,
      recentCaptures: recentCaptures.map((c) => ({
        id: c.id,
        thumbKey: c.thumbKey ?? c.objectKey,
        type: c.captureType,
        createdAt: c.createdAt,
        status: c.status,
      })),
      shareBreakdown,
      shareStatusBreakdown,
      retention: {
        retentionDays,
        recordsToDelete: pendingDeletion,
      },
    };
  }
}
