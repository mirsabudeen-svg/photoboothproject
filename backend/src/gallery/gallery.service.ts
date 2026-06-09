import {
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { EventEntity } from '../events/event.entity';
import { PosthogService } from '../analytics/posthog.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { GalleryResponse } from './dto/gallery-response.dto';

const THEME_COLORS: Record<string, string> = {
  luxury_gold: '#D4A843',
  kerala_traditional: '#CC3300',
  royal_purple: '#7B2FBE',
};

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(EventEntity) private readonly events: Repository<EventEntity>,
    @InjectRepository(CaptureEntity) private readonly captures: Repository<CaptureEntity>,
    private readonly storage: R2StorageService,
    private readonly posthog: PosthogService,
  ) {}

  async getGallery(
    eventId: string,
    token: string,
    opts: { cursor?: string; limit?: number; userAgent?: string } = {},
  ): Promise<GalleryResponse> {
    const event = await this.events.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Gallery not available');
    if (!event.galleryPublishedAt) throw new NotFoundException('Gallery not available');
    if (event.galleryToken !== token) throw new UnauthorizedException('Invalid gallery link');
    if (event.galleryExpiresAt && event.galleryExpiresAt < new Date()) {
      throw new GoneException('Gallery link has expired');
    }

    const config = event.config as { themeId?: string; primaryColor?: string };
    const themeId = config.themeId ?? 'luxury_gold';
    const limit = opts.limit ?? 50;

    const qb = this.captures
      .createQueryBuilder('capture')
      .where('capture.eventId = :eventId', { eventId })
      .andWhere('capture.status != :deleted', { deleted: 'deleted' })
      .andWhere('(capture.thumbKey IS NOT NULL OR capture.webpKey IS NOT NULL OR capture.objectKey IS NOT NULL)')
      .orderBy('capture.createdAt', 'ASC')
      .addOrderBy('capture.id', 'ASC')
      .take(limit + 1);

    if (opts.cursor) {
      const cursorRow = await this.captures.findOne({
        where: { id: opts.cursor, eventId },
        select: ['id', 'createdAt'],
      });
      if (cursorRow) {
        qb.andWhere(
          '(capture.createdAt > :cursorAt OR (capture.createdAt = :cursorAt AND capture.id > :cursorId))',
          { cursorAt: cursorRow.createdAt, cursorId: cursorRow.id },
        );
      }
    }

    const rows = await qb
      .select([
        'capture.id',
        'capture.captureType',
        'capture.thumbKey',
        'capture.webpKey',
        'capture.objectKey',
        'capture.createdAt',
      ])
      .getMany();

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const captures = page.map((c) => ({
      id: c.id,
      type: c.captureType,
      thumbnailUrl: this.storage.publicUrl(c.thumbKey ?? c.objectKey),
      fullUrl: this.storage.publicUrl(c.webpKey ?? c.objectKey),
      capturedAt: c.createdAt,
    }));

    const isBot = /bot|crawler|spider|preview|whatsapp|facebookexternalhit/i.test(opts.userAgent ?? '');
    if (!isBot) {
      this.posthog.capture({
        distinctId: eventId,
        event: 'gallery_viewed',
        properties: {
          captureCount: captures.length,
          source: 'direct',
          eventId,
        },
      });
    }

    return {
      event: {
        name: event.name,
        theme: themeId,
        primaryColor: config.primaryColor ?? THEME_COLORS[themeId] ?? '#D4A843',
      },
      captures,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }
}
