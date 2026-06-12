# MASTER PROMPT — paste into Cursor Agent after adding atelier-kit to the repo

You are the implementation engineer for "The Atelier" — a luxury wedding photobooth
redesign. The design system is fully specified and already in this repo inside
`atelier-kit/`. Your job is to apply it to the existing application WITHOUT changing
any business logic, API calls, state management, camera pipeline, printing, or
delivery functionality. This is a visual and experiential refactor only.

## CONTEXT
- Product: kiosk wedding photobooth (touch, viewed at arm's length, guests may be
  unfamiliar with the app and in a hurry). Flow: Welcome → Experience Selection →
  Camera Prep → Countdown → Capture → Review → AI Enhancement → Layout →
  Personalization → Delivery → Print Queue → Success.
- Design doctrine lives in `atelier-kit/.cursorrules`. Read it fully before any edit
  and treat it as law for every file you touch. Move it to the project root so it
  governs all future sessions.
- The kit contains production-ready code. Prefer using it over writing equivalents.

## KIT CONTENTS (atelier-kit/)
- `.cursorrules` — enforced design law (color, type, shape, motion, copy, a11y)
- `styles/tokens.css` — all design tokens as CSS variables + global resets
- `tailwind.atelier.ts` — Tailwind theme extension (colors, fonts, kiosk type scale,
  easings, durations, hit sizes)
- `lib/motion.ts` — the ONLY allowed framer-motion variants/easings
- `components/primitives/` — ScreenShell, AtelierButton, SelectionCard,
  ProgressNarrated, CountdownRing
- `MIGRATION_PLAN.md` — the phase order you must follow

## EXECUTION RULES
1. Work phase by phase per MIGRATION_PLAN.md. Complete and verify a phase before
   starting the next. After each phase, output: files changed, what was replaced,
   anything you could NOT map to the system (ask, don't improvise).
2. Never modify: API routes/services logic, Firebase calls, camera/capture logic,
   print drivers, state machines/stores, data models. If a visual change requires a
   logic change, STOP and propose it first.
3. Never introduce: new colors, new fonts, border-radius, drop shadows (except the
   single capture-photo shadow defined in tokens), gradients (except welcome ambient
   + processing shimmer), default/linear easings, lone spinners, more than one solid
   gold button per screen.
4. All copy you write speaks TO the guest in plain warm language ("Stand inside the
   frame and look toward the lens") — never system language ("Initializing camera").
   Errors: what happened + what's next; staff code goes in the footer metadata; never
   "Oops", never apologies.
5. If a file conflicts with the system (e.g. a UI library with baked-in radii),
   wrap or replace it with a primitive; do not fight it with overrides.

## PHASE 0 — INSTALL (do this first, then pause for my confirmation)
1. Detect the frontend framework, styling setup, and component structure. Report it.
2. Move `.cursorrules` to repo root. Place kit files into the correct src locations
   for this project (adjust import aliases like `@/lib/motion` to match the repo).
3. Import `tokens.css` FIRST in the global stylesheet. Merge `tailwind.atelier.ts`
   into the Tailwind config via `theme.extend`.
4. Install fonts (next/font or link tags): Cormorant Garamond 400/500 + italics,
   Jost 300/400/500, IBM Plex Mono 400/500. Install framer-motion if absent.
5. Build the app. Confirm: black canvas, zero rounded corners anywhere, fonts load.
6. Output a screen inventory: list every screen/route in the app mapped to S01–S12,
   plus any screens that don't fit the map.

## PHASE 1 — TOKEN SWEEP
Replace every hardcoded color, font-family, font-size, shadow, and border-radius in
the frontend with Atelier tokens / Tailwind classes. Logic untouched. Then run a
self-check: grep for hex values, `rounded`, `shadow-` in components and report
remaining hits with justification.

## PHASE 2 — CHROME & PRIMITIVES
- Wrap every screen in `<ScreenShell eventLine footLine>`; event name/couple names
  bind from the existing event config, step indicator in footLine ("Step 2 of 6").
- Replace all buttons with `<AtelierButton>`: exactly one `primary` per screen;
  back/skip become `variant="skip"` in the footer band.
- Replace every loading state with `<ProgressNarrated stage>` with human stage copy
  per operation ("Composing your portrait…", "Rendered for print", "Printing —
  about 20 seconds").
- Replace option lists/grids with `<SelectionCard>` inside the `cascade` variant
  parent. Cap visible choices at 5; group GIF/Boomerang/Video under one
  expandable "Motion" row if needed.

## PHASE 3 — THE MOMENT (countdown → capture → review)
- Countdown: `<CountdownRing from={3} onComplete={existingCaptureFn} onBeat={chime}>`,
  camera preview dimmed to 40% behind it, instruction line "Eyes to the lens" in
  mono caption. Wire onBeat to existing audio if present, else stub.
- Capture: ivory full-screen `flash` overlay (90ms) at the existing shutter trigger;
  captured photo enters with the `develop` variant (700ms darkroom reveal).
- Review: photo is the screen; one control band — "Keep This" (primary) + "Retake"
  (hairline). Enforce max 2 retakes using existing state if available (add a local
  counter if not — this is the one permitted minor state addition). Show
  "Retakes remaining: N" in footLine.

## PHASE 4 — SERVICE LAYER
- Idle: 45s without touch → bottom sheet "Still there?" with "Continue" /
  auto-reset to Welcome after 15s more. Implement as a wrapper hook; do not alter
  screen logic.
- Error presentation: create one ErrorSheet component (bottom sheet, one decision).
  Route existing error handlers through it with { guestCopy, staffCode, fallback }.
  Wire two fallbacks if the hooks exist: printer unavailable → Delivery screen hides
  Print and leads with QR; network down → QR from local asset, queue remote sends.
- Confirm captures persist locally before any network call (report current behavior;
  propose the change if missing, don't implement unprompted).

## PHASE 5 — POLISH & AUDIT
- AnimatePresence at the router/screen-switch level so every transition uses
  `screenTransition` (450ms).
- Hit-target pass: every interactive ≥ 88px with ≥ 24px gaps.
- aria-live on countdown and ProgressNarrated; aria-pressed on SelectionCard;
  verify prefers-reduced-motion path renders cross-fades only.
- Final report: per-screen checklist from MIGRATION_PLAN "Definition of done",
  plus before/after notes and any deviations awaiting my decision.

Begin with Phase 0 now. After Phase 0, stop and show me the framework report and
screen inventory before proceeding.
