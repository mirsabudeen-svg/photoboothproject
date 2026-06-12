'use client';
/**
 * ReadinessChips — the S03 status row. Color + glyph (never color alone).
 * FramingGuide — dashed guide zone overlay, turns champagne when framing passes.
 */
import { AnimatePresence, motion } from 'framer-motion';
import type { ReadinessResult, ReadinessConfig } from '@/lib/readiness/types';
import { EASE } from '@/lib/motion';

const LABELS: Record<string, string> = {
  faces: 'Guests',
  framing: 'Framing',
  lighting: 'Light',
  eyes: 'Eyes',
  stability: 'Still',
};

export function ReadinessChips({
  result,
  show = ['framing', 'lighting', 'faces'],
}: { result: ReadinessResult; show?: (keyof ReadinessResult['signals'])[] }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3 justify-center flex-wrap" aria-live="polite">
        {show.map((key) => {
          const s = result.signals[key];
          const label =
            key === 'faces' && result.faceCount > 0
              ? `${result.faceCount} ${result.faceCount === 1 ? 'guest' : 'guests'}`
              : LABELS[key];
          return (
            <span
              key={key}
              className={[
                'font-meta uppercase tracking-[0.24em] text-k-meta px-5 py-3 border transition-colors duration-fast',
                s === 'pass'
                  ? 'bg-champagne text-surface-base border-champagne'
                  : s === 'fail'
                    ? 'border-state-warning/60 text-state-warning'
                    : 'border-hairline text-content-secondary',
              ].join(' ')}
            >
              {label} {s === 'pass' ? '✓' : ''}
            </span>
          );
        })}
      </div>

      {/* one instruction at a time, cross-fading */}
      <div className="h-8">
        <AnimatePresence mode="wait">
          {result.hint && (
            <motion.p
              key={result.hint}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EASE.luxe }}
              className="font-body text-k-body text-content-primary text-center"
            >
              {result.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function FramingGuide({
  zone,
  pass,
}: { zone: ReadinessConfig['zone']; pass: boolean }) {
  return (
    <div
      aria-hidden
      className={[
        'absolute border border-dashed transition-colors duration-fast pointer-events-none',
        pass ? 'border-champagne/60' : 'border-content-display/30',
      ].join(' ')}
      style={{
        left: `${zone.x * 100}%`,
        top: `${zone.y * 100}%`,
        width: `${zone.w * 100}%`,
        height: `${zone.h * 100}%`,
      }}
    >
      {/* head circle hint */}
      <div
        className={[
          'absolute left-1/2 -translate-x-1/2 border border-dashed rounded-full transition-colors duration-fast',
          pass ? 'border-champagne/50' : 'border-content-display/25',
        ].join(' ')}
        style={{ top: '14%', width: '34%', aspectRatio: '1', borderRadius: '50%' }}
      />
    </div>
  );
}
