# Deployment Guide

## Android

1. Generate release keystore
2. `./gradlew :app:assembleProdRelease`
3. Sign APK with `apksigner`
4. Distribute via Firebase App Distribution or MDM

Flavors: `dev` (10.0.2.2 API), `staging`, `prod`

## Backend (Render / Fly.io)

1. Provision Postgres
2. Set env from `.env.example` (R2 credentials, Twilio optional)
3. `npm run build && npm run start:prod`
4. Health check: `GET /api/v1/events`

## R2

1. Create bucket `photobooth-media`
2. Configure S3-compatible API credentials
3. Set `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
4. Optional: Cloudflare Worker for public gallery

## Admin dashboard (Vercel)

1. Set `NEXT_PUBLIC_API_URL`
2. `npm run build`
3. Deploy to Vercel

## CI (GitHub Actions)

See `.github/workflows/build.yml` — Gradle assemble + unit tests on push.
