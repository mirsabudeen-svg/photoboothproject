import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../common/admin-api-key.guard';
import { DeviceTokenGuard } from '../auth/guards/device-token.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(AdminApiKeyGuard)
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Get(':eventId/config')
  @UseGuards(DeviceTokenGuard)
  getConfig(@Param('eventId') eventId: string) {
    return this.eventsService.getConfig(eventId);
  }

  @Get(':eventId/stats')
  @UseGuards(AdminApiKeyGuard)
  getStats(@Param('eventId') eventId: string) {
    return this.eventsService.getStats(eventId);
  }

  @Get(':eventId/detail')
  @UseGuards(AdminApiKeyGuard)
  getDetail(@Param('eventId') eventId: string) {
    return this.eventsService.getDetail(eventId);
  }

  @Post(':eventId/gallery/publish')
  @UseGuards(AdminApiKeyGuard)
  publishGallery(@Param('eventId') eventId: string) {
    return this.eventsService.publishGallery(eventId);
  }

  @Delete(':eventId/gallery/publish')
  @UseGuards(AdminApiKeyGuard)
  unpublishGallery(@Param('eventId') eventId: string) {
    return this.eventsService.unpublishGallery(eventId);
  }

  @Get()
  @UseGuards(AdminApiKeyGuard)
  list() {
    return this.eventsService.list();
  }
}
