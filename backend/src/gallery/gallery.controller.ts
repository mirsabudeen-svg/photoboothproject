import { Controller, Get, Headers, Param, Query, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GalleryService } from './gallery.service';
import { GalleryResponse } from './dto/gallery-response.dto';

const GALLERY_TOKEN_RE = /^[a-f0-9]{12}$/;

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get(':eventId')
  @Throttle({ medium: { limit: 60, ttl: 60000 } })
  getGallery(
    @Param('eventId') eventId: string,
    @Query('token') token?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<GalleryResponse> {
    if (!token) throw new UnauthorizedException('Gallery token required');
    if (!GALLERY_TOKEN_RE.test(token)) throw new UnauthorizedException('Invalid gallery token');
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100) : 50;
    return this.galleryService.getGallery(eventId, token, {
      cursor,
      limit: parsedLimit,
      userAgent,
    });
  }
}
