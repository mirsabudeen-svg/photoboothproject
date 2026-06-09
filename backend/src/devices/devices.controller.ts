import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString } from 'class-validator';
import { DeviceTokenGuard } from '../auth/guards/device-token.guard';
import { AdminApiKeyGuard } from '../common/admin-api-key.guard';
import { DevicesService } from './devices.service';
import { Device } from './device.entity';

class PairDeviceDto {
  @IsString()
  pairingCode: string;

  @IsString()
  deviceName: string;

  @IsString()
  deviceModel: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;
}

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('pair')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  pair(@Body() dto: PairDeviceDto) {
    return this.devicesService.pair(dto);
  }

  @Post('token/refresh')
  @UseGuards(DeviceTokenGuard)
  refreshToken(@Req() req: { device: Device }) {
    return this.devicesService.refreshToken(req.device.id);
  }

  @Get()
  @UseGuards(AdminApiKeyGuard)
  list() {
    return this.devicesService.listAll();
  }
}
