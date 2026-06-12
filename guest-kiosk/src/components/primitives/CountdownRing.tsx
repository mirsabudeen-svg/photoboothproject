'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '@/lib/motion';

/** Cinematic countdown: ring sweeps 360°/s, numeral settles 1.06→1.00.
 *  "1" holds 200ms longer — the held breath before the shutter. */
export function CountdownRing({
  from = 3,
  onComplete,
  onBeat, // hook your rising chime here: (n) => playChime(n)
}: { from?: number; onComplete: () => void; onBeat?: (n: number) => void }) {
  const [n, setN] = useState(from);

  useEffect(() => {
    onBeat?.(n);
    if (n === 0) return void onComplete();
    const t = setTimeout(() => setN(n - 1), n === 1 ? 1200 : 1000);
    return () => clearTimeout(t);
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="relative w-[28rem] h-[28rem] max-w-[70vw] max-h-[70vw] flex items-center justify-center"
      role="timer"
      aria-live="assertive"
      aria-label={n > 0 ? `${n}` : 'Capturing'}
    >
      {/* outer halo */}
      <div className="absolute -inset-4 rounded-full border border-gold/15" style={{ borderRadius: '50%' }} />
      {/* sweeping ring */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(198,161,91,.25)" strokeWidth="0.5" />
        <motion.circle
          key={n}
          cx="50" cy="50" r="48" fill="none"
          stroke="#C6A15B" strokeWidth="0.75"
          strokeDasharray="301.6" initial={{ strokeDashoffset: 301.6 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: n === 1 ? 1.2 : 1, ease: 'linear' }}
        />
      </svg>
      <AnimatePresence mode="wait">
        {n > 0 && (
          <motion.span
            key={n}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE.settle }}
            className="font-display text-content-display"
            style={{ fontSize: 'clamp(120px, 22vw, 220px)', lineHeight: 1 }}
          >
            {n}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
