import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { DevicesModule } from '../devices/devices.module';
import { QueueModule } from '../queue/queue.module';
import { ShareEntity } from './share.entity';
import { SharingWebhookController } from './sharing-webhook.controller';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';
import { TwilioSignatureGuard } from '../auth/guards/twilio-signature.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShareEntity, CaptureEntity]),
    DevicesModule,
    QueueModule,
  ],
  controllers: [SharingController, SharingWebhookController],
  providers: [SharingService, TwilioSignatureGuard],
})
export class SharingModule {}
