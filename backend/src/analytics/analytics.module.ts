import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from '../devices/devices.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsEventEntity } from './analytics-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEventEntity]), DevicesModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
