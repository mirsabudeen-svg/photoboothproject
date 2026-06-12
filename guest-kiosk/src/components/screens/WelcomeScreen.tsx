'use client';

import { motion } from 'framer-motion';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { getEventLine } from '@/lib/event-config';
import { useKioskSession } from '@/lib/kiosk-session';

export function WelcomeScreen() {
  const { event, goNext } = useKioskSession();

  return (
    <ScreenShell eventLine={getEventLine(event)} footLine="Step 1 of 6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(198,161,91,0.08) 0%, transparent 70%)',
        }}
      />
      <div className="relative flex flex-col items-center gap-12 text-center">
        <h1 className="font-display italic text-content-display text-k-display font-medium">
          {event.brideName}
          <span className="not-italic text-champagne"> & </span>
          {event.groomName}
        </h1>
        {event.hashtag && (
          <p className="font-meta uppercase tracking-[0.3em] text-k-meta text-gold-deep">
            {event.hashtag}
          </p>
        )}
        <p className="font-body text-k-sub text-content-secondary max-w-lg">
          Step inside — we&apos;ll capture a portrait you&apos;ll want to keep
        </p>
        <AtelierButton variant="primary" onClick={goNext}>
          Begin
        </AtelierButton>
      </div>
    </ScreenShell>
  );
}
