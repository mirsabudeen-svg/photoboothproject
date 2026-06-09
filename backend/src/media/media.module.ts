import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { StorageModule } from '../storage/storage.module';
import { MediaProcessorService } from './media-processor.service';

@Module({
  imports: [TypeOrmModule.forFeature([CaptureEntity]), StorageModule],
  providers: [MediaProcessorService],
  exports: [MediaProcessorService],
})
export class MediaModule {}
