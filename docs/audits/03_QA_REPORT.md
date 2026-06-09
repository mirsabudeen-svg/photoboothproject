# QA Report

## Test Execution Summary

| Stack | Automated Tests | Manual/Build Verification | Result |
|-------|-----------------|---------------------------|--------|
| **Backend** | None | `npm run build` | **PASS** (after audit fixes) |
| **Admin dashboard** | None | `npm run build` | **PASS** |
| **Android** | None | Gradle build | **NOT RUN** — wrapper incomplete; no JDK in CI shell |

## Automated Testing — Not Executed

No project-owned tests exist:

- 0× backend `*.spec.ts`
- 0× admin `*.test.tsx`
- 0× Android `src/test` or `androidTest`

**Browser matrix (Chrome/Edge/Safari/Firefox):** Not applicable to kiosk; admin dashboard not tested in browsers during audit.

**Responsive matrix (1920/1440/1366/iPad/mobile):** Not executed — admin uses minimal inline CSS; kiosk is portrait-fixed.

## Functional Testing — Code Review Based

### Guest Flow

| Step | Expected | Finding |
|------|----------|---------|
| Attract → Start | Navigate to consent | **PASS** (code path verified) |
| Consent accept | Navigate to capture | **PASS** |
| Photo capture | Single DB save, composite, print, upload | **PASS** (after dedup fix) |
| GIF/boomerang | Animated output | **FAIL** — placeholder encoder |
| Share QR | LAN URL loads image | **PASS** (logic verified; not device-tested) |
| SMS share | Queue with phone | **PARTIAL** — UI added; Twilio stub |
| Done | Reset to attract | **PASS** |
| Double navigation | Single share navigation | **PASS** (LaunchedEffect removed) |

### Admin Flow

| Step | Expected | Finding |
|------|----------|---------|
| List events | Shows events | **PASS** with `ADMIN_API_KEY` set |
| Create event | POST succeeds | **PASS** via `/api/events` proxy |
| Dashboard stats | Aggregate counts | **PASS** (stats endpoint added) |
| Auth failure | 401 without key | **PASS** when key configured |

### API Endpoints

| Endpoint | Success | Edge/Failure |
|----------|---------|--------------|
| `POST /devices/pair` | Not tested live | Invalid code throws generic Error |
| `GET /events/:id/config` | Not tested live | Public access — security issue |
| `POST /captures` | Not tested live | Requires paired device + DB + R2 |
| `POST /analytics/batch` | Not tested live | New in audit |
| `GET /health` | Not tested live | Shallow check only |

## Loading / Empty / Error States

| Surface | Loading | Empty | Error |
|---------|---------|-------|-------|
| Admin home | Missing | Shows 0 events | Silent catch → empty |
| Admin events | Missing | "No events yet" | Unhandled fetch fail |
| Capture screen | Partial | N/A | Added in CaptureViewModel |
| Share SMS | N/A | Button disabled if blank | No toast on fail |
| Upload worker | N/A | N/A | Logs only |

## Regression Risks (High)

1. Print worker without physical printer
2. R2 credentials absent → upload silent fail
3. Camera permission denied → unclear UX
4. Lock Task without Device Owner → graceful degradation untested

## Recommended Test Plan

### Phase 1 — Smoke (1 week)

- [ ] Backend: Jest supertest for all 11 routes
- [ ] Admin: Playwright create event + list
- [ ] Android: `./gradlew :app:assembleDevDebug` in CI

### Phase 2 — E2E (2 weeks)

- [ ] Detox or Maestro: full guest flow on emulator
- [ ] Mock R2 + Twilio in integration tests
- [ ] Field checklist (`docs/FIELD_TEST_CHECKLIST.md`) on real hardware

### Phase 3 — Continuous

- [ ] Screenshot tests for admin
- [ ] Performance baseline: capture → composite < 2s on target tablet

## Issues Log

| ID | Severity | Component | Issue |
|----|----------|-----------|-------|
| QA-001 | Critical | Android | No automated build in CI verified |
| QA-002 | Critical | All | Zero unit tests |
| QA-003 | High | Android | GIF/boomerang non-functional |
| QA-004 | High | Backend | No integration test with Postgres |
| QA-005 | Medium | Admin | No error boundary |
| QA-006 | Medium | Android | SMS success not confirmed to user |
