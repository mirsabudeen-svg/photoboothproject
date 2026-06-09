import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { PosthogModule } from '../analytics/posthog.module';
import { QueueModule } from '../queue/queue.module';
import { ShareEntity } from '../sharing/share.entity';
import { SmsModule } from '../sms/sms.module';
import { StorageModule } from '../storage/storage.module';
import { SmsWorker } from './sms.worker';

@Module({
  imports: [
    QueueModule,
    TypeOrmModule.forFeature([ShareEntity, CaptureEntity]),
    SmsModule,
    StorageModule,
    PosthogModule,
  ],
  providers: [SmsWorker],
})
export class WorkersModule {}
