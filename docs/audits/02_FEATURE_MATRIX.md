# Feature Matrix

| Feature | Purpose | Status | Dependencies | Risks | Missing | Improvements |
|---------|---------|--------|--------------|-------|---------|--------------|
| **Kiosk Lock Task** | Prevent guest exit | **Complete** | Device Admin | Requires provisioning | MDM docs | Auto-provision script |
| **Boot receiver** | Auto-start after reboot | **Complete** | RECEIVE_BOOT_COMPLETED | Battery opt kill | Foreground service | FGS + notification |
| **Attract screen** | Draw guests in | **Partial** | Event config | Static if no event | Dynamic theme/video | Lottie/video attract |
| **Admin unlock (5-tap)** | Operator access | **Complete** | PIN | PIN `1234` hardcoded | Secure PIN storage | Hashed PIN + remote set |
| **Consent flow** | Legal compliance | **Complete** | Room DB | Text not lawyer-reviewed | Per-locale templates | Admin-editable consent |
| **Photo capture** | Core deliverable | **Complete** | CameraX, permissions | Permission denial UX | Retry UI | Countdown + preview |
| **GIF capture** | Social sharing | **Broken** | Encoder | Placeholder encoder | Real GIF encoder | FFmpeg or custom |
| **Boomerang** | Social sharing | **Broken** | Encoder | Placeholder | Reverse loop encoder | MediaCodec pipeline |
| **Beauty filter** | On-device polish | **Partial** | GPUImage/TFLite | Unprofiled GPU load | Filter picker UI | Event-config presets |
| **Template overlay** | Branded prints | **Partial** | LayoutCompositor | Theme not from server | Pull config from API | PDF/SVG templates |
| **Print queue** | Instant prints | **Partial** | ESC/POS stub | Real printer untested | DNP/Sinfonia drivers | Print status UI |
| **Local QR share** | Guest download | **Complete** | NanoHTTPD | Cleartext HTTP | HTTPS/mTLS | Tokenized URLs |
| **SMS share** | Remote delivery | **Partial** | Twilio backend | Stub + phone UX added | Twilio SDK | E.164 validation |
| **WhatsApp share** | Social | **Complete** | Share intent | App may be absent | Fallback message | |
| **Email share** | Social | **Complete** | Share intent | Generic intent | Pre-filled subject | |
| **Cloud upload** | Backup/gallery | **Partial** | R2, WorkManager | No retry UI | Upload progress | Exponential backoff metrics |
| **Device pairing** | Secure provisioning | **Broken** | Backend `/devices/pair` | No UI | Pairing screen | QR code pairing |
| **Event config sync** | Remote theming | **Broken** | Events API | Demo event only | Sync worker | Version polling |
| **Analytics batch** | Ops telemetry | **Partial** | New endpoint | Client may not send | Wire Android client | PostHog/Sentry |
| **Crash recovery** | Reliability | **Partial** | Local crash log | No remote upload | Sentry Android | |
| **Admin dashboard** | Event management | **Partial** | Next.js | No auth UI | Login, event detail | shadcn/ui |
| **Admin stats** | Monitoring | **Partial** | Stats API (new) | Per-event only | Real-time | WebSocket/poll |
| **Multi-event** | Agency use | **Placeholder** | DB schema | Single active event | Event switcher | |
| **Multi-tenant** | Platform | **Placeholder** | — | Out of MVP scope | tenant_id | PLATFORM_MIGRATION |
| **Retention (30-day)** | Privacy | **Missing** | Cron/worker | No purge job | R2 lifecycle + DB job | |
| **Offline recovery** | Venue Wi-Fi drops | **Partial** | Room queues | Untested long offline | Conflict resolution | |
| **DSLR support** | Pro quality | **N/A** | — | Out of scope | — | Phase 2 |

## Status Legend

- **Complete** — Implemented and wired for happy path
- **Partial** — Works with known gaps
- **Broken** — Does not work or compile/runtime failure
- **Untested** — Code exists, no verification
- **Placeholder** — Stub/mock implementation
- **Missing** — Not implemented

## Wedding Vertical Coverage

| Use case | Ready? |
|----------|--------|
| Luxury wedding (single booth) | **Beta** with on-site engineer |
| Corporate activation | **No** — branding/config immature |
| Exhibition / conference | **No** — multi-booth not ready |
| Brand launch | **No** — analytics/SLA insufficient |
