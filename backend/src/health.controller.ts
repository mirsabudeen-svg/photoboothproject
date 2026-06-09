import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { SkipThrottle } from '@nestjs/throttler';
import { Queue } from 'bullmq';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
    ) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectQueue('sms') private readonly smsQueue: Queue,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async check(): Promise<{
    status: string;
    db: string;
    redis: string;
    uptime: number;
    timestamp: string;
    version: string;
    sentry: string;
    queues?: { sms: { waiting: number; active: number; failed: number } };
  }> {
    let dbStatus = 'ok';
    let redisStatus = 'ok';
    let criticalFailure = false;

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      dbStatus = 'unreachable';
      criticalFailure = true;
    }

    try {
      const client = (await this.smsQueue.client) as unknown as { ping: () => Promise<string> };
      const pong = await client.ping();
      redisStatus = pong === 'PONG' ? 'ok' : 'unreachable';
      if (redisStatus !== 'ok') criticalFailure = true;
    } catch {
      redisStatus = 'unreachable';
      criticalFailure = true;
    }

    const [waiting, active, failed] = await Promise.all([
      this.smsQueue.getWaitingCount().catch(() => 0),
      this.smsQueue.getActiveCount().catch(() => 0),
      this.smsQueue.getFailedCount().catch(() => 0),
    ]);

    const body = {
      status: criticalFailure ? 'error' : redisStatus === 'ok' && dbStatus === 'ok' ? 'ok' : 'degraded',
      db: dbStatus,
      redis: redisStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: readPackageVersion(),
      sentry: this.config.get<string>('SENTRY_DSN') ? 'configured' : 'unconfigured',
      queues: { sms: { waiting, active, failed } },
    };

    if (criticalFailure) {
      throw new ServiceUnavailableException(body);
    }

    return body;
  }
}
