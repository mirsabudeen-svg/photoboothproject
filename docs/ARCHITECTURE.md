# Architecture

Multi-module Clean Architecture Android app with platform migration seams.

## Layers

- **Presentation**: Compose screens in `feature:*`, navigation in `app`
- **Domain**: Pure models, repository interfaces, use cases (`core:domain`)
- **Data**: Room + Retrofit implementations (`core:data`, `core:database`, `core:network`)
- **Hardware**: CameraX, ESC/POS printer abstractions

## Offline-first

1. Captures persisted to SQLCipher Room with `idempotency_key`
2. WorkManager drains upload queue when network available
3. Local NanoHTTPD server serves media for offline QR (`feature:sharing`)

## Backend

NestJS modular monolith: `devices`, `events`, `captures`, `sharing`. Media uploads go direct to Cloudflare R2 via presigned PUT.

## Kiosk

`kiosk` module: Device Admin + Lock Task Mode + boot receiver + PIN admin unlock.

## Deferred (platform V1)

- DSLR tether, cloud AI (Fal.ai), multi-tenant RLS, Stripe, fleet MDM
