import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL', 'redis://localhost:6379') },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'sms' }),
    BullModule.registerQueue({ name: 'email' }),
    BullModule.registerQueue({ name: 'whatsapp' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
