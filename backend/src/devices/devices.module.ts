import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceTokenGuard } from '../auth/guards/device-token.guard';
import { Device } from './device.entity';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [DevicesController],
  providers: [DevicesService, DeviceTokenGuard],
  exports: [DevicesService, DeviceTokenGuard],
})
export class DevicesModule {}
