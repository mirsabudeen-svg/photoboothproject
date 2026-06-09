import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DeviceTokenGuard } from '../auth/guards/device-token.guard';
import { CreateShareDto } from './dto/create-share.dto';
import { SharingService } from './sharing.service';

@Controller('shares')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post()
  @UseGuards(DeviceTokenGuard)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  create(@Headers('authorization') auth: string, @Body() dto: CreateShareDto) {
    return this.sharingService.queue(auth, dto);
  }
}
