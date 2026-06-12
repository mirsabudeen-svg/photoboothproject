/** ATELIER readiness detection — shared types */

export type SignalState = 'pass' | 'pending' | 'fail';

export interface ReadinessSignals {
  /** required number of faces detected (per experience type) */
  faces: SignalState;
  /** all faces inside the framing guide zone, at usable size */
  framing: SignalState;
  /** scene luminance within capture-quality range */
  lighting: SignalState;
  /** all detected eyes open */
  eyes: SignalState;
  /** subjects still enough for a sharp frame */
  stability: SignalState;
}

export interface ReadinessResult {
  signals: ReadinessSignals;
  /** true when all required signals have held 'pass' for holdMs */
  ready: boolean;
  faceCount: number;
  /** ONE plain-language instruction for the guest, or null when ready */
  hint: string | null;
}

export interface ReadinessConfig {
  /** faces expected: single=1, couple=2, group=2–8 */
  minFaces: number;
  maxFaces: number;
  /** guide zone as fractions of the video frame */
  zone: { x: number; y: number; w: number; h: number };
  /** face bbox height as fraction of frame height */
  minFaceSize: number;
  maxFaceSize: number;
  /** mean luma 0–255 */
  minLuma: number;
  maxLuma: number;
  /** ms all required signals must hold before ready fires */
  holdMs: number;
  /** signals that gate readiness (eyes/stability are advisory for groups) */
  required: (keyof ReadinessSignals)[];
}

export const PRESETS: Record<'single' | 'couple' | 'group', ReadinessConfig> = {
  single: {
    minFaces: 1, maxFaces: 1,
    zone: { x: 0.18, y: 0.08, w: 0.64, h: 0.78 },
    minFaceSize: 0.14, maxFaceSize: 0.42,
    minLuma: 60, maxLuma: 215, holdMs: 800,
    required: ['faces', 'framing', 'lighting', 'eyes', 'stability'],
  },
  couple: {
    minFaces: 2, maxFaces: 2,
    zone: { x: 0.10, y: 0.08, w: 0.80, h: 0.80 },
    minFaceSize: 0.11, maxFaceSize: 0.36,
    minLuma: 60, maxLuma: 215, holdMs: 800,
    required: ['faces', 'framing', 'lighting', 'eyes', 'stability'],
  },
  group: {
    minFaces: 2, maxFaces: 8,
    zone: { x: 0.05, y: 0.05, w: 0.90, h: 0.88 },
    minFaceSize: 0.07, maxFaceSize: 0.30,
    minLuma: 55, maxLuma: 220, holdMs: 1000,
    // eyes/stability advisory only — 8 people never all pass at once
    required: ['faces', 'framing', 'lighting'],
  },
};
