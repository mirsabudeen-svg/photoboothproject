'use client';
import { motion } from 'framer-motion';
import { screenTransition } from '@/lib/motion';

/** Constant page chrome: event metadata above, system metadata below,
 *  content breathing between. Wrap every screen S01–S12 in this. */
export function ScreenShell({
  eventLine,   // e.g. "Aisha & Omar · The Atelier"
  footLine,    // e.g. "Step 2 of 6"  (staff error codes also live here)
  children,
}: { eventLine?: string; footLine?: string; children: React.ReactNode }) {
  return (
    <motion.main
      {...screenTransition}
      className="relative flex flex-col min-h-dvh bg-surface-base overflow-hidden"
    >
      {eventLine && (
        <header className="pt-12 text-center font-meta uppercase tracking-[0.34em] text-k-meta text-gold-deep">
          {eventLine}
        </header>
      )}
      <div className="flex-1 flex flex-col items-center justify-center gap-12 px-12">
        {children}
      </div>
      {footLine && (
        <footer className="pb-10 text-center font-meta uppercase tracking-[0.3em] text-k-meta text-content-secondary/60">
          {footLine}
        </footer>
      )}
    </motion.main>
  );
}
