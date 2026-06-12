import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';
import { PosthogModule } from './analytics/posthog.module';
import { QueueModule } from './queue/queue.module';
import { WorkersModule } from './workers/workers.module';
import { CapturesModule } from './captures/captures.module';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { GalleryModule } from './gallery/gallery.module';
import { HealthController } from './health.controller';
import { AdminApiKeyGuard } from './common/admin-api-key.guard';
import { RetentionModule } from './retention/retention.module';
import { SharingModule } from './sharing/sharing.module';
import { SmsModule } from './sms/sms.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(process.env.NODE_ENV !== 'test' ? [ScheduleModule.forRoot()] : []),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 200 },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        migrationsRun: config.get('NODE_ENV') === 'test',
        logging: config.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
        ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        extra: {
          max: 20,
          min: 2,
          acquireTimeoutMillis: 30_000,
        },
      }),
      inject: [ConfigService],
    }),
    StorageModule,
    DevicesModule,
    EventsModule,
    GalleryModule,
    CapturesModule,
    SharingModule,
    AnalyticsModule,
    PosthogModule,
    QueueModule,
    ...(process.env.NODE_ENV !== 'test' ? [WorkersModule] : []),
    SmsModule,
    RetentionModule,
  ],
  controllers: [HealthController],
  providers: [
    AdminApiKeyGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
