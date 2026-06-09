import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { Device } from '../devices/device.entity';
import { DevicesModule } from '../devices/devices.module';
import { ShareEntity } from '../sharing/share.entity';
import { EventEntity } from './event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EventEntity, CaptureEntity, ShareEntity, Device]),
    DevicesModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
