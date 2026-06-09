# Security Audit Report

## Threat Model

**Assets:** Guest photos, device tokens, admin API key, R2 credentials, pairing codes  
**Actors:** Guests (physical kiosk), venue staff, remote attacker, malicious upload

## Findings & Fixes

### Critical

| ID | Finding | Status | Fix |
|----|---------|--------|-----|
| SEC-001 | Admin endpoints unauthenticated | **Fixed** | `AdminApiKeyGuard` + env `ADMIN_API_KEY` |
| SEC-002 | Admin dashboard didn't send API key | **Fixed** | Server-side `lib/api.ts` + `/api/events` proxy |
| SEC-003 | Hardcoded kiosk PIN `1234` | **Open** | Store hashed PIN in encrypted prefs; remote config |
| SEC-004 | Hardcoded SQLCipher passphrase | **Open** | Android Keystore-derived key |
| SEC-005 | Public `GET /events/:id/config` | **Open** | Require device bearer token |
| SEC-006 | Default pairing code `WEDDING2025` | **Open** | Require env in prod; rotate per event |

### High

| ID | Finding | Status | Fix |
|----|---------|--------|-----|
| SEC-007 | Open CORS when unset | **Partial** | `CORS_ORIGINS` env; document required in prod |
| SEC-008 | Cleartext HTTP for QR server | **Accepted risk** | Document kiosk-only; consider HTTPS with self-signed |
| SEC-009 | Local media server unauthenticated | **Open** | Short-lived signed tokens in URL path |
| SEC-010 | Device tokens never expire | **Open** | Add `expiresAt` + refresh flow |
| SEC-011 | No rate limiting | **Open** | `@nestjs/throttler` on pair/capture/share |
| SEC-012 | TypeORM synchronize in dev | **Open** | Migrations only; never sync in prod |

### Medium

| ID | Finding | Status | Fix |
|----|---------|--------|-----|
| SEC-013 | No request validation on Events DTO | **Open** | class-validator decorators |
| SEC-014 | No helmet/security headers | **Open** | `helmet` middleware |
| SEC-015 | Upload MIME not validated server-side | **Open** | Validate content-type on complete |
| SEC-016 | No file size limits on presign | **Open** | Max size in presign policy |
| SEC-017 | `allowBackup=false` good | **OK** | — |
| SEC-018 | Secrets in `.env.example` placeholders | **OK** | Never commit real `.env` |

### Upload Security

- Presigned PUT to R2 — good pattern (no backend blob storage)
- **Missing:** virus scan, magic-byte validation, per-device quotas
- **Android:** captures stored in app-private storage — OK

### RBAC

- **Roles:** None implemented
- **Current:** Binary admin key vs device token vs anonymous config
- **Recommendation:** Admin users table + JWT for dashboard; device scoped to event

### JWT

- Not used; opaque UUID device tokens instead — acceptable for MVP if rotated

## Authentication Flow (Target State)

```
Admin User → NextAuth/Clerk → JWT → Backend validates role
Kiosk → Pairing QR → one-time code → device token (scoped to event, TTL 90d)
Guest → No auth (physical access only); QR URLs tokenized
```

## Secrets Checklist

| Secret | Location | Client exposure |
|--------|----------|-----------------|
| `ADMIN_API_KEY` | Backend + Next server env | **No** (server-only) |
| `R2_*` | Backend only | **No** |
| `TWILIO_*` | Backend only | **No** |
| `PAIRING_CODE` | Backend env | **No** |
| Device token | Android EncryptedSharedPrefs | On-device |
| SQLCipher key | Hardcoded in source | **CRITICAL LEAK** |

## Compliance Notes (Weddings)

- Consent captured locally — need export/sync for GDPR requests
- 30-day retention not enforced — privacy policy gap
- Biometrics explicitly out of scope per Master PRD — **OK**

## Priority Fixes

1. Rotate/remove hardcoded PIN and SQLCipher passphrase
2. Protect event config endpoint
3. Add rate limiting + helmet
4. Token expiry and event binding on captures
5. Signed QR URLs with TTL
