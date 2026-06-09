import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { ShareEntity } from '../sharing/share.entity';
import { StorageModule } from '../storage/storage.module';
import { RetentionController } from './retention.controller';
import { RetentionScheduler } from './retention.scheduler';
import { RetentionService } from './retention.service';

@Module({
  imports: [
    ScheduleModule,
    TypeOrmModule.forFeature([CaptureEntity, ShareEntity]),
    StorageModule,
  ],
  controllers: [RetentionController],
  providers: [RetentionService, ...(process.env.NODE_ENV === 'test' ? [] : [RetentionScheduler])],
  exports: [RetentionService],
})
export class RetentionModule {}
