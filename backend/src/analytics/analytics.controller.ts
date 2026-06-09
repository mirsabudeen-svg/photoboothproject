import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevicesService } from '../devices/devices.service';
import { AnalyticsEventEntity } from './analytics-event.entity';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    @InjectRepository(AnalyticsEventEntity)
    private readonly events: Repository<AnalyticsEventEntity>,
    private readonly devicesService: DevicesService,
  ) {}

  @Post('batch')
  async batch(
    @Req() req: { headers: { authorization?: string } },
    @Body() body: { events: Array<{ type: string; payload?: Record<string, unknown>; timestamp?: string }> },
  ) {
    const auth = req.headers.authorization?.replace('Bearer ', '') ?? '';
    const device = await this.devicesService.findByToken(auth);
    if (!device) throw new UnauthorizedException();
    const rows = (body.events ?? []).map((e) =>
      this.events.create({
        deviceId: device.id,
        type: e.type,
        payload: e.payload ?? {},
        occurredAt: e.timestamp ? new Date(e.timestamp) : new Date(),
      }),
    );
    if (rows.length) await this.events.save(rows);
    return { accepted: rows.length };
  }
}
