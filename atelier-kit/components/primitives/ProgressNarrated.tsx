'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '@/lib/motion';

/**
 * Replaces every spinner in the app.
 * Always shows a human stage label; bar is determinate when progress is known.
 * e.g. <ProgressNarrated stage="Composing your portrait…" progress={0.62} />
 */
export function ProgressNarrated({
  stage,
  progress,
}: { stage: string; progress?: number }) {
  return (
    <div className="flex flex-col items-center gap-6 w-full" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={stage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: EASE.luxe }}
          className="font-meta uppercase tracking-[0.28em] text-k-meta text-state-processing"
        >
          {stage}
        </motion.span>
      </AnimatePresence>
      <div className="w-2/3 h-px bg-gold/20 relative overflow-hidden">
        {progress !== undefined ? (
          <motion.div
            className="absolute inset-y-0 left-0 bg-gold"
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ ease: 'easeOut' }}
          />
        ) : (
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-gold to-transparent"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
    </div>
  );
}
