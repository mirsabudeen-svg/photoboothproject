# Wedding Photobooth Backend

NestJS API for device pairing, event config, capture uploads (R2 presign), SMS sharing, and analytics.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

## Database Migrations

**Never use `synchronize: true`.** Schema changes are applied via TypeORM migrations only.

```bash
# Show pending migrations
npm run migration:show

# Apply migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate a new migration after entity changes (review output before committing)
npm run migration:generate -- src/migrations/DescriptiveName
```

Ensure `DATABASE_URL` points to your PostgreSQL instance before running migrations.

## Development

```bash
npm run start:dev
```

## Production

```bash
npm run build
npm run migration:run
npm run start:prod
```

Required production env vars: `DATABASE_URL`, `ADMIN_API_KEY`, `PAIRING_CODE` (not default), `CORS_ORIGINS`, R2 credentials, optional Twilio and Sentry.

## Tests

```bash
npm test
```
