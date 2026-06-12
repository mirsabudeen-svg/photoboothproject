# ATELIER READINESS MODULE
On-device capture-readiness detection. The countdown only starts when the shot
will succeed. MediaPipe FaceLandmarker (GPU, fully offline) — no cloud, no
per-frame cost, no guest data leaves the kiosk.

## What it checks (per frame, ~5ms)
| Signal     | How                                                        |
|------------|------------------------------------------------------------|
| faces      | Face count matches experience (single=1, couple=2, group 2–8) |
| framing    | Every face inside the guide zone, size within range        |
| lighting   | Mean luma 60–215, sampled at 2Hz on a 64px thumbnail       |
| eyes       | Blendshapes eyeBlinkLeft/Right < 0.45 on all faces         |
| stability  | Mean face-center drift < 0.012/frame                       |

Gate: all *required* signals must hold continuously for `holdMs` (800ms single/
couple, 1000ms group). For groups, eyes/stability are advisory only — eight people
never all pass at once.

## Guest hints — one at a time, priority ordered
light → faces → framing → eyes → stillness. Plain warm language:
"Step forward into the light" · "Gather everyone into the frame" ·
"Come a little closer" · "Eyes open, look to the lens" · "Perfect — hold it there".

## Files
- lib/readiness/types.ts    — signals, config, the three presets
- lib/readiness/engine.ts   — ReadinessEngine (MediaPipe + analysis)
- hooks/useReadiness.ts     — rAF loop hook, graceful degradation
- components/capture/ReadinessChips.tsx — chips + hint line + FramingGuide
- components/capture/CameraPrep.tsx     — full S03 reference screen

## Install
1. `npm i @mediapipe/tasks-vision`
2. Ship models LOCALLY (never CDN at a live event):
   - copy `node_modules/@mediapipe/tasks-vision/wasm/*` → `public/models/wasm/`
   - download `face_landmarker.task` (Google AI Edge model page, float16)
     → `public/models/face_landmarker.task`
3. Drop `lib/ hooks/ components/` into src (aligns with the atelier-kit aliases).
4. Replace your current prep screen with `<CameraPrep experience onReadyConfirmed>`.

## Tuning at the venue
All thresholds live in PRESETS (types.ts). The two you'll touch on-site:
- minLuma — dark ballrooms: drop to ~45 if the booth has its own ring light
- holdMs  — impatient crowds: 600ms feels snappier, 800ms gives better stills

## Failure doctrine
If MediaPipe init fails, the hook sets `ready: true` and the booth works as a
normal photobooth — AI gating must never block a wedding. Error code
READINESS_INIT_FAILED surfaces in the staff metadata layer only.

## Next step on this foundation
The same engine output powers auto best-shot: burst 3 frames at capture, rerun
eyes/stability scoring per frame offline, keep the highest scorer.
