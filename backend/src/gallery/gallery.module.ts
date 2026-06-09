import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptureEntity } from '../captures/capture.entity';
import { EventEntity } from '../events/event.entity';
import { StorageModule } from '../storage/storage.module';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, CaptureEntity]), StorageModule],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
