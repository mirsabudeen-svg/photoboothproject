import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from '../devices/devices.module';
import { MediaModule } from '../media/media.module';
import { CaptureEntity } from './capture.entity';
import { EventEntity } from '../events/event.entity';
import { CapturesController } from './captures.controller';
import { CapturesService } from './captures.service';

@Module({
  imports: [TypeOrmModule.forFeature([CaptureEntity, EventEntity]), DevicesModule, MediaModule],
  controllers: [CapturesController],
  providers: [CapturesService],
})
export class CapturesModule {}
