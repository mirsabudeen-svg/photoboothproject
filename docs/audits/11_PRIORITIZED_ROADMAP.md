# Prioritized Improvement Roadmap

## Critical (Before commercial launch)

| # | Item | Owner | Effort |
|---|------|-------|--------|
| C1 | TypeORM migrations; disable synchronize everywhere | Backend | 2d |
| C2 | Automated smoke tests (API + admin Playwright) | QA | 3d |
| C3 | Replace hardcoded PIN + SQLCipher passphrase | Android | 1d |
| C4 | Device pairing UI + secure token storage | Android | 3d |
| C5 | Twilio SMS integration (real send + status webhook) | Backend | 2d |
| C6 | Protect `GET /events/:id/config` with device token | Backend | 0.5d |
| C7 | GIF/boomerang encoder implementation | Android | 5d |
| C8 | `@nestjs/throttler` + helmet | Backend | 0.5d |
| C9 | Sentry Android + NestJS | DevOps | 1d |
| C10 | Gradle wrapper complete + CI Android build | DevOps | 1d |

## High (Before multi-event/agency use)

| # | Item | Effort |
|---|------|--------|
| H1 | Event config sync worker on kiosk | 2d |
| H2 | Theme application from event config | 2d |
| H3 | Capture retake/preview UX | 2d |
| H4 | Admin login (Clerk/Better Auth) | 2d |
| H5 | Event detail page + per-event analytics | 2d |
| H6 | Signed TTL tokens for local QR URLs | 1d |
| H7 | 30-day retention job (R2 lifecycle + DB) | 2d |
| H8 | Real ESC/POS printer driver validation | 3d |
| H9 | Rate limit pairing code attempts | 0.5d |
| H10 | Docker Compose for local full stack | 1d |

## Medium (Quality & polish)

| # | Item | Effort |
|---|------|--------|
| M1 | shadcn/ui admin redesign | 3d |
| M2 | Design tokens single source | 1d |
| M3 | Off-main-thread image pipeline | 1d |
| M4 | Loading/error boundaries admin | 1d |
| M5 | Redis cache for event config | 1d |
| M6 | Maestro guest flow E2E | 3d |
| M7 | ESLint + Prettier monorepo | 1d |
| M8 | Health check with DB ping | 0.5d |
| M9 | Foreground service for kiosk reliability | 2d |
| M10 | WCAG admin pass | 2d |

## Low (Platform / future)

| # | Item | Effort |
|---|------|--------|
| L1 | AI NSFW moderation on upload | 3d |
| L2 | Multi-tenant `tenant_id` migration | 5d |
| L3 | Cloud guest gallery web app | 5d |
| L4 | DSLR module | 10d+ |
| L5 | BullMQ SMS worker | 2d |
| L6 | PostHog product analytics | 1d |
| L7 | Framer Motion attract animations | 2d |
| L8 | Corporate/exhibition preset packs | 3d |

## Sprint Suggestion (2 weeks)

**Week 1:** C1, C3, C5, C6, C8, C10, H1  
**Week 2:** C2, C4, C7 (start), C9, H2, H3

## Audit Fixes Already Applied

See [CHANGELOG_AUDIT_FIXES.md](./CHANGELOG_AUDIT_FIXES.md).
