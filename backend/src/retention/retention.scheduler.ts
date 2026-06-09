import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RetentionService } from './retention.service';

@Injectable()
export class RetentionScheduler {
  constructor(private readonly retention: RetentionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledSweep() {
    await this.retention.runRetentionSweep();
  }
}
