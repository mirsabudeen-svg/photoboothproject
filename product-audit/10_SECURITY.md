# Security Audit

**Score:** 48/100 — Not production-ready without remediation

---

## Authentication Review

| Mechanism | Implementation | Risk |
|-----------|----------------|------|
| Device token | 64-char hex, plaintext in DB | Medium — DB dump exposes tokens |
| Admin API key | `X-Admin-Api-Key` header | **High** — bypass if env unset |
| Supabase auth | Optional admin login | Low — dev bypass when unconfigured |
| Gallery token | 12-char hex (48-bit entropy) | Medium — brute-forceable |
| Local QR token | HMAC-SHA256, 15min TTL | Low — well designed ✅ |
| Twilio webhook | Signature validation (prod only) | Medium — open in staging |

---

## Authorization Review

| Resource | Guard | Gap |
|----------|-------|-----|
| Event management | AdminApiKeyGuard | No RBAC; single key |
| Device endpoints | DeviceTokenGuard | No per-event scope |
| Gallery public | Query token | Low entropy |
| Analytics batch | Manual token check | No `@UseGuards` decorator |
| Admin API routes (Next.js) | None (middleware skips `/api/*`) | AI route self-checks; others rely on backend key only |

---

## Critical Risks

### SEC-001: Admin API Key Bypass
**File:** `backend/src/common/admin-api-key.guard.ts`  
**Issue:** If `ADMIN_API_KEY` env var is unset, guard returns `true` — all admin endpoints publicly accessible.  
**Impact:** Event creation, device listing, retention sweep, gallery management exposed.  
**Fix:** Fail closed — reject all requests if key not configured.

### SEC-002: Object Key Hijack on Complete
**File:** `backend/src/captures/captures.service.ts`  
**Issue:** `CompleteCaptureDto.objectKey` not validated against stored capture key. Device could reference another capture's R2 object.  
**Impact:** Data integrity, potential cross-capture access.  
**Fix:** Validate `dto.objectKey === capture.objectKey`.

### SEC-003: Device Token Plaintext Storage
**File:** `backend/src/devices/device.entity.ts`  
**Issue:** `accessToken` stored as plaintext in PostgreSQL.  
**Impact:** DB breach exposes all active device sessions.  
**Fix:** Store SHA-256 hash; compare on lookup.

### SEC-004: Device Credentials in DataStore
**File:** `core/data/.../DeviceCredentialsStore.kt`  
**Issue:** Device token stored in unencrypted DataStore (duplicate in sync module).  
**Impact:** Rooted device or backup extraction exposes token.  
**Fix:** Migrate to EncryptedSharedPreferences (partially done for PIN).

---

## Medium Risks

| ID | Risk | Location |
|----|------|----------|
| SEC-005 | Gallery token 48-bit entropy | `events.service.ts` publishGallery |
| SEC-006 | Twilio webhook open in non-prod | `twilio-signature.guard.ts` |
| SEC-007 | No rate limit on analytics batch | `analytics.controller.ts` |
| SEC-008 | SQLCipher passphrase in source | Room database module |
| SEC-009 | `/api/*` admin routes skip middleware | `admin-dashboard/middleware.ts` |
| SEC-010 | `contentType` free-form on capture create | `create-capture.dto.ts` |

---

## Low Risks

| ID | Risk |
|----|------|
| SEC-011 | No device revocation endpoint exposed |
| SEC-012 | CORS correctly enforced in production ✅ |
| SEC-013 | Helmet applied with cross-origin policy ✅ |
| SEC-014 | PII scrubbed in PostHog before send ✅ |
| SEC-015 | Retention sweep nulls share destinations ✅ |

---

## File Upload Security

| Check | Status |
|-------|--------|
| Presigned PUT (not direct upload) | ✅ |
| Magic byte validation on complete | ✅ JPEG/PNG/WebP |
| File size limit | ❌ Not enforced |
| Content-Type allowlist on create | ❌ Free-form string |
| Virus scanning | ❌ Not implemented |

---

## Input Validation

| Endpoint | Validation | Gap |
|----------|------------|-----|
| Create event | class-validator, Zod (admin) | ✅ |
| Create capture | Basic decorators | contentType, size |
| Create share | Channel enum | destination format |
| Pair device | pairingCode string | ✅ |
| Gallery query | token regex, limit cap | ✅ |

---

## Secrets Management

| Secret | Storage | Risk |
|--------|---------|------|
| `ADMIN_API_KEY` | `.env` | OK if deployed securely |
| `PAIRING_CODE` | `.env` | Default `WEDDING2025` blocked in prod ✅ |
| `R2_*` credentials | `.env` | OK |
| `TWILIO_*` | `.env` | OK |
| SQLCipher passphrase | Source code | **High** |
| QR signing key | EncryptedSharedPreferences | ✅ |
| PIN hash | EncryptedSharedPreferences + BCrypt | ✅ |
| Device token | DataStore plaintext | **Medium** |

---

## Compliance Gaps

| Requirement | Status |
|-------------|--------|
| GDPR consent capture | ✅ Local Room + server potential |
| GDPR right to deletion | ⚠️ Retention sweep exists; no user-initiated delete |
| GDPR data portability | ❌ No export for guests |
| Privacy policy document | ❌ Not in repo |
| Cookie consent (admin) | ❌ PostHog tracking without banner |
| PCI compliance | N/A — no payments |
| Photo consent at event | ✅ Consent screen |

---

## Security Recommendations (Priority Order)

1. **Fail-closed AdminApiKeyGuard** — block if key missing
2. **Validate objectKey on capture complete**
3. **Hash device tokens at rest** (backend)
4. **Encrypt device credentials** (Android DataStore → EncryptedSharedPreferences)
5. **Increase gallery token entropy** (32+ bytes, base64url)
6. **Add rate limiting to analytics batch**
7. **Enforce Twilio signature in staging**
8. **Add file size limits on capture upload**
9. **Expose device revocation endpoint**
10. **Remove SQLCipher passphrase from source** — use Android Keystore

---

## Security Score Breakdown

| Area | Score |
|------|-------|
| Authentication | 5/10 |
| Authorization | 4/10 |
| Data protection | 5/10 |
| Input validation | 6/10 |
| Secrets management | 4/10 |
| API security | 5/10 |
| Compliance | 3/10 |
| **Overall** | **48/100** |
