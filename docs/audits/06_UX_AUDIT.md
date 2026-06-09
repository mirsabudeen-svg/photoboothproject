# UX / UI Audit Report

Evaluated against standards from Stripe (clarity), Linear (speed), Apple (polish), and wedding luxury context.

## First Impression

| Surface | Score | Notes |
|---------|-------|-------|
| Kiosk attract | 6/10 | Functional; lacks motion, couple names prominence, brand immersion |
| Admin dashboard | 4/10 | Developer-minimal; inline styles; no brand |

**Severity: Medium** — Acceptable for internal ops; not client-facing portal quality.

**Solution:** Wedding theme system with full-bleed attract, animated gold accents, couple monogram. Admin: shadcn/ui + sidebar nav.

## Navigation

| Issue | Severity | Solution |
|-------|----------|----------|
| Admin has no breadcrumbs/back | Low | Add layout nav component |
| Kiosk flow linear only — good | — | Maintain simplicity |
| No escape hatch if camera fails | High | Error screen + "Call attendant" |

## User Flow (Guest)

**Strengths:** Short path (4 taps to photo); large buttons; consent before capture.

**Issues:**

| Issue | Severity | Steps to fix |
|-------|----------|--------------|
| No countdown before shutter | Medium | 3-2-1 overlay in CaptureScreen |
| No preview retake | High | Add "Retake" / "Use photo" |
| Share screen cognitive load | Medium | Primary QR; secondary channels collapsed |
| SMS requires typing on kiosk | Medium | Optional QR-to-SMS web flow |
| No thank-you / brand moment | Low | Post-share branded screen 3s |

## Visual Hierarchy

- Gold `#FFD700` on dark — on-brand for luxury wedding
- Typography inconsistent (system default vs Compose Material)
- No spacing scale documented

## Feedback States

| State | Kiosk | Admin |
|-------|-------|-------|
| Loading | Missing on capture | Missing on fetch |
| Success | Implicit navigation | Redirect only on create |
| Error | Partial | Generic "Failed to create" |

**Fix:** Add Compose `Snackbar` / admin toast library.

## Empty States

- Admin events empty message — **OK**
- Dashboard zeros — **OK** after stats fix

## Conversion Optimization (Wedding)

1. Show hashtag on share screen for Instagram
2. Auto-open QR fullscreen
3. Print preview thumbnail
4. "Share to wedding gallery" CTA when cloud ready

## Screenshots

Not captured during audit (no running emulator/browser session). Recommend Playwright + Maestro screenshot baselines in CI.

## Implementation Priority

1. Retake/preview flow (High)
2. Capture countdown (Medium)
3. Admin design system (Medium)
4. Error/loading polish (Medium)
5. Post-share brand moment (Low)
