# Accessibility Report (WCAG 2.1 AA Target)

## Summary

Kiosk targets **operational accessibility** (large touch, high contrast) more than **screen reader compliance**. Admin dashboard lacks semantic structure. **Estimated conformance: Partial — below AA for admin; kiosk untested with TalkBack.**

## Keyboard Navigation

| Surface | Status | Issue |
|---------|--------|-------|
| Admin | **Fail** | No focus styles; native inputs only |
| Kiosk | **N/A** | Touch-first; keyboard unlikely |

**Fix:** Admin — use focus-visible rings; logical tab order in forms.

## Screen Readers

| Element | Status |
|---------|--------|
| QR image | Has `contentDescription = "QR code"` — **Pass** |
| BigButton | Unknown label propagation — **Review** |
| Attract admin gesture | No SR alternative — **Fail** (provide staff corner tap) |

## Contrast Ratios

| Pair | Est. ratio | AA? |
|------|------------|-----|
| Gold `#FFD700` on `#2c2c2c` | ~8:1 | **Pass** |
| Gold on black `#1a1a1a` | ~10:1 | **Pass** |
| Muted text 70% opacity | ~4.5:1 | **Borderline** — verify |

## Focus States

- Compose Material3 default focus — likely OK on kiosk
- Admin inline styles — **no visible focus**

## Semantic HTML

- Admin uses `<h1>`, `<nav>`, `<form>` — **Partial pass**
- Missing `<main>`, landmark regions
- Lists for events — **Pass**

## Touch Targets

- `BigButton` designed for kiosk — **likely ≥48dp** — verify in `BigButton.kt`

## Motion

- No reduced-motion preference — add `isReducedMotion` check if animations added

## Priority Fixes

1. Admin: focus-visible + landmarks (Medium)
2. Kiosk: audible countdown option for low vision (Low)
3. Consent text: scrollable + scalable font (Medium)
4. Run TalkBack pass on Capture + Share screens (High for compliance claims)

## Testing Checklist

- [ ] axe-core on admin pages
- [ ] TalkBack on Android capture flow
- [ ] Color contrast analyzer on theme tokens
- [ ] 200% font scaling on consent screen
