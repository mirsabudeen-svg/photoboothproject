/**
 * ATELIER readiness engine.
 * MediaPipe Tasks Vision FaceLandmarker, GPU, fully on-device.
 * One instance per camera session; call analyze(video, t) per animation frame.
 *
 * npm i @mediapipe/tasks-vision
 * Ship the .task model locally (/public/models/face_landmarker.task) —
 * the booth must never depend on a CDN at a wedding.
 */
import {
  FaceLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import {
  PRESETS,
  type ReadinessConfig,
  type ReadinessResult,
  type ReadinessSignals,
  type SignalState,
} from './types';

const WASM_PATH = '/models/wasm'; // copy @mediapipe/tasks-vision/wasm here
const MODEL_PATH = '/models/face_landmarker.task';

// blendshape indices we care about
const BLINK_LEFT = 'eyeBlinkLeft';
const BLINK_RIGHT = 'eyeBlinkRight';
const BLINK_THRESHOLD = 0.45; // above = eye considered closed

export class ReadinessEngine {
  private landmarker: FaceLandmarker | null = null;
  private config: ReadinessConfig;
  private lumaCanvas = document.createElement('canvas');
  private lumaCtx = this.lumaCanvas.getContext('2d', { willReadFrequently: true })!;
  private prevCenters: { x: number; y: number }[] = [];
  private passSince: number | null = null;
  private lastLumaSample = 0;
  private luma = 128;

  constructor(preset: keyof typeof PRESETS | ReadinessConfig = 'couple') {
    this.config = typeof preset === 'string' ? PRESETS[preset] : preset;
    this.lumaCanvas.width = 64;
    this.lumaCanvas.height = 64;
  }

  setPreset(preset: keyof typeof PRESETS | ReadinessConfig) {
    this.config = typeof preset === 'string' ? PRESETS[preset] : preset;
    this.passSince = null;
  }

  async init() {
    const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
    this.landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 8,
      outputFaceBlendshapes: true,
    });
  }

  destroy() {
    this.landmarker?.close();
    this.landmarker = null;
  }

  /** Call once per rAF with the live <video>. Cheap: landmarker ~5ms, luma 1/500ms. */
  analyze(video: HTMLVideoElement, nowMs: number): ReadinessResult {
    const c = this.config;
    const empty: ReadinessSignals = {
      faces: 'pending', framing: 'pending', lighting: 'pending',
      eyes: 'pending', stability: 'pending',
    };
    if (!this.landmarker || video.readyState < 2) {
      return { signals: empty, ready: false, faceCount: 0, hint: 'Starting camera…' };
    }

    // ---- lighting (sampled at 2Hz on a 64px thumbnail) ----
    if (nowMs - this.lastLumaSample > 500) {
      this.lastLumaSample = nowMs;
      this.lumaCtx.drawImage(video, 0, 0, 64, 64);
      const d = this.lumaCtx.getImageData(0, 0, 64, 64).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 16) // every 4th pixel
        sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      this.luma = sum / (d.length / 16);
    }
    const lighting: SignalState =
      this.luma >= c.minLuma && this.luma <= c.maxLuma ? 'pass' : 'fail';

    // ---- faces ----
    const res = this.landmarker.detectForVideo(video, nowMs);
    const faces = res.faceLandmarks ?? [];
    const faceCount = faces.length;
    const facesOk: SignalState =
      faceCount >= c.minFaces && faceCount <= c.maxFaces
        ? 'pass'
        : faceCount === 0 ? 'pending' : 'fail';

    // bounding boxes (normalized) from landmarks
    const boxes = faces.map((lm) => {
      let minX = 1, minY = 1, maxX = 0, maxY = 0;
      for (const p of lm) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY,
               cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
    });

    // ---- framing: every face inside zone, size in range ----
    const z = c.zone;
    let framing: SignalState = facesOk === 'pass' ? 'pass' : 'pending';
    let framingHint: string | null = null;
    for (const b of boxes) {
      const inside =
        b.x >= z.x && b.y >= z.y && b.x + b.w <= z.x + z.w && b.y + b.h <= z.y + z.h;
      if (!inside) { framing = 'fail'; framingHint = 'Step into the frame'; break; }
      if (b.h < c.minFaceSize) { framing = 'fail'; framingHint = 'Come a little closer'; break; }
      if (b.h > c.maxFaceSize) { framing = 'fail'; framingHint = 'Take one step back'; break; }
    }

    // ---- eyes: blendshapes, all faces ----
    let eyes: SignalState = facesOk === 'pass' ? 'pass' : 'pending';
    const shapes = res.faceBlendshapes ?? [];
    for (const fb of shapes) {
      const get = (name: string) =>
        fb.categories.find((x) => x.categoryName === name)?.score ?? 0;
      if (get(BLINK_LEFT) > BLINK_THRESHOLD || get(BLINK_RIGHT) > BLINK_THRESHOLD) {
        eyes = 'fail';
        break;
      }
    }

    // ---- stability: mean center drift across frames ----
    let stability: SignalState = 'pending';
    if (boxes.length) {
      const centers = boxes.map((b) => ({ x: b.cx, y: b.cy }));
      if (this.prevCenters.length === centers.length) {
        let drift = 0;
        for (let i = 0; i < centers.length; i++) {
          // match nearest previous center (cheap, fine for ≤8 faces)
          let best = Infinity;
          for (const p of this.prevCenters) {
            const d = Math.hypot(centers[i].x - p.x, centers[i].y - p.y);
            if (d < best) best = d;
          }
          drift += best;
        }
        stability = drift / centers.length < 0.012 ? 'pass' : 'fail';
      }
      this.prevCenters = centers;
    } else {
      this.prevCenters = [];
    }

    const signals: ReadinessSignals = { faces: facesOk, framing, lighting, eyes, stability };

    // ---- gate: required signals must hold for holdMs ----
    const allPass = c.required.every((k) => signals[k] === 'pass');
    if (allPass) {
      this.passSince ??= nowMs;
    } else {
      this.passSince = null;
    }
    const ready = this.passSince !== null && nowMs - this.passSince >= c.holdMs;

    // ---- ONE hint, priority-ordered, guest language ----
    let hint: string | null = null;
    if (!ready) {
      if (lighting === 'fail')
        hint = this.luma < c.minLuma ? 'Step forward into the light' : 'Step back from the light';
      else if (facesOk !== 'pass')
        hint = faceCount === 0
          ? 'Step in front of the camera'
          : faceCount < c.minFaces
            ? 'Gather everyone into the frame'
            : 'This portrait is for fewer guests';
      else if (framing === 'fail') hint = framingHint;
      else if (c.required.includes('eyes') && eyes === 'fail') hint = 'Eyes open, look to the lens';
      else if (c.required.includes('stability') && stability === 'fail') hint = 'Hold still for a moment';
      else if (allPass) hint = 'Perfect — hold it there';
    }

    return { signals, ready, faceCount, hint };
  }
}
