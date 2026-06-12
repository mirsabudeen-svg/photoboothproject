import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './common/sentry-exception.filter';

function validateRequiredEnv(): void {
  if (process.env.NODE_ENV === 'test') return;
  const required = [
    'DATABASE_URL',
    'PAIRING_CODE',
    'R2_BUCKET',
    'TWILIO_ACCOUNT_SID',
    'REDIS_URL',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const adminKey = process.env.ADMIN_API_KEY ?? '';
  if (isProd && adminKey.trim().length < 32) {
    console.error('FATAL: ADMIN_API_KEY must be set (≥32 chars) in production');
    process.exit(1);
  }
}

async function bootstrap() {
  validateRequiredEnv();

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new SentryExceptionFilter());

  const allowedOrigins =
    config.get<string>('CORS_ORIGINS')?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (config.get('NODE_ENV') === 'production' && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must be set in production. Refusing to start with open CORS.');
  }
  app.enableCors({
    origin:
      config.get('NODE_ENV') === 'production'
        ? (origin, cb) => cb(null, allowedOrigins.includes(origin ?? ''))
        : true,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Photobooth API listening on port ${port}`);
}
bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
