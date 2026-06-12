# UX Audit

**Benchmarks:** Stripe (clarity), Linear (speed), Apple (polish), luxury wedding context  
**Audit Date:** June 10, 2026

---

## Friction Points

| # | Friction | Severity | Where |
|---|----------|----------|-------|
| 1 | Battery optimization dialog on every app launch | High | `MainActivity` |
| 2 | No feedback when SMS send fails | High | Share screen |
| 3 | Pairing requires manual code entry (no QR scan) | Medium | Pairing screen |
| 4 | Beauty filter invisible until after confirm | Medium | Capture → Share |
| 5 | Admin panel is text-only health dump | Medium | Admin screen |
| 6 | No loading state during capture processing | Medium | Capture → Share transition |
| 7 | "No Thanks" on consent returns to attract with no explanation | Low | Consent |
| 8 | Gallery admin shows capture type labels, not photos | Medium | Event detail |
| 9 | Analytics page duplicates dashboard | Low | `/analytics` |
| 10 | No mobile layout for admin sidebar | High | All admin pages |
| 11 | Settings page is read-only | Medium | `/settings` |
| 12 | No edit/delete for events or devices | Medium | Admin |

---

## Confusing Flows

| Flow | Confusion | Recommendation |
|------|-----------|----------------|
| First launch after pair | No event → was dead consent button (fixed) | Show "Waiting for event config" state |
| Demo event auto-bootstrap | Operator may not know cloud event isn't active | Indicator in admin panel |
| QR sharing on emulator | IP unreachable from physical phone | Show URL text fallback on share screen |
| Supabase optional auth | Dev bypass vs production login unclear | Environment badge in admin header |
| Lock Task vs normal mode | Guest can escape without Device Owner | Provisioning checklist before event |

---

## Excessive Clicks

| Task | Clicks/Taps | Ideal | Notes |
|------|-------------|-------|-------|
| Guest photo share | 6+ (begin → agree → mode → capture → use → done) | 4–5 | Acceptable for photobooth |
| Access on-device admin | 7+ (5-tap + PIN + unlock) | 5 | Security justified |
| Create event + publish gallery | 12+ form fields + 2 pages | 8 | AI gen helps |
| Pair device | 3 (code + button) | 1 (QR scan) | Missing scanner |

---

## Dead Ends

| Dead End | Location |
|----------|----------|
| Analytics page — no unique content | `/analytics` |
| Settings — nothing configurable | `/settings` |
| Camera permission denied | Capture (no recovery UI) |
| Pairing failure — only error text | Pairing screen |
| No active event (pre-fix) | Consent — fixed |

---

## Poor Feedback

| Action | Current Feedback | Needed |
|--------|------------------|--------|
| SMS send | None | Toast: queued / failed |
| Upload sync | Queue count in admin only | Progress indicator |
| Print job | Queue count | Success/fail toast |
| AI generate | Loading spinner | ✅ Adequate |
| Gallery publish | Toast | ✅ Adequate |
| Capture processing | Blank transition | Processing overlay |

---

## Missing States

| State | Platform | Priority |
|-------|----------|----------|
| Empty events list | Admin | Medium |
| Empty devices list | Admin | Medium |
| Network offline banner | Kiosk | High |
| Camera permission rationale | Kiosk | High |
| Token expired / re-pair | Kiosk | High |
| Gallery expired | Public gallery | Medium |
| Error boundary | Admin | Medium |
| Skeleton loaders | Admin event detail | Low |

---

## Slow Processes

| Process | Perceived Speed | Cause |
|---------|-----------------|-------|
| Cold start (emulator) | ~6s white splash | Material light theme, Hilt init |
| Photo processing | 1–3s gap | Beauty filter + composite on Default dispatcher |
| Gallery first load | Fast (ISR 30s) | Server-rendered |
| Dashboard stats | Moderate | N+1 stats calls per event |
| GIF encoding | Variable | CPU LZW on device |

---

## Cognitive Overload

| Screen | Issue |
|--------|-------|
| Create Event form | 10+ fields on one page — mitigated by sections |
| Share screen | 5 buttons equal weight — no primary CTA hierarchy |
| Admin panel | Raw metrics without context or thresholds |
| Capture mode select | 3 equal buttons — OK for kiosk |

---

## Journey Scores (1–10)

| Journey | Usability | Simplicity | Accessibility | Delight | Conversion |
|---------|-----------|------------|---------------|---------|------------|
| **Guest: First photo** | 7 | 8 | 5 | 6 | 7 |
| **Guest: QR download** | 6 | 7 | 4 | 5 | 6 |
| **Guest: GIF/Boomerang** | 6 | 7 | 4 | 7 | 6 |
| **Operator: Pair device** | 5 | 6 | 5 | 4 | — |
| **Operator: Create event** | 7 | 6 | 6 | 7 | — |
| **Operator: Monitor event** | 6 | 5 | 5 | 5 | — |
| **Operator: On-device admin** | 5 | 5 | 4 | 3 | — |
| **Guest: Public gallery** | 7 | 8 | 6 | 7 | 6 |
| **Operator: Export PDF** | 7 | 7 | 6 | 6 | — |

**Average Usability:** 6.2/10  
**Average Accessibility:** 5.0/10 — **critical gap**

---

## Accessibility Gaps

| Issue | WCAG | Status |
|-------|------|--------|
| TalkBack on kiosk | 4.1.2 | ❌ Unverified |
| Touch targets (BigButton) | 2.5.5 | ✅ Likely pass (large buttons) |
| Color contrast (gold on dark) | 1.4.3 | ⚠️ Not measured |
| Reduce motion support | 2.3.3 | ✅ Attract + admin respect |
| Focus indicators (admin) | 2.4.7 | ❌ Missing |
| Screen reader labels on QR | 1.1.1 | ✅ `contentDescription` set |
| PIN input accessibility | 1.3.5 | ⚠️ No input type hints |

---

## Top 10 UX Improvements (Impact Order)

1. Add offline/network status banner on kiosk
2. SMS/upload success/failure toasts
3. QR URL text fallback + copy button on share screen
4. Skip battery optimization prompt on dev/emulator builds
5. Capture processing loading overlay
6. Mobile-responsive admin sidebar
7. Capture thumbnails in event detail
8. QR scanner for pairing
9. Empty states across admin
10. Dedicated analytics with charts (not dashboard duplicate)
