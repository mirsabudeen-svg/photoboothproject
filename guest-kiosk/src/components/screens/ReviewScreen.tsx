'use client';

import { motion } from 'framer-motion';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { develop } from '@/lib/motion';
import { getEventLine } from '@/lib/event-config';
import { stepNumber, useKioskSession } from '@/lib/kiosk-session';

export function ReviewScreen() {
  const { event, capturedUrl, retakesRemaining, goNext, consumeRetake } = useKioskSession();

  if (!capturedUrl) return null;

  return (
    <ScreenShell
      eventLine={getEventLine(event)}
      footLine={`Retakes remaining: ${retakesRemaining}`}
    >
      <motion.img
        {...develop}
        src={capturedUrl}
        alt="Your portrait"
        className="w-full max-w-[min(92vw,960px)] max-h-[62dvh] object-contain"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}
      />
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl">
        <AtelierButton variant="primary" onClick={goNext} className="flex-1">
          Keep This
        </AtelierButton>
        {retakesRemaining > 0 && (
          <AtelierButton variant="hairline" onClick={() => consumeRetake()} className="flex-1">
            Retake
          </AtelierButton>
        )}
      </div>
    </ScreenShell>
  );
}
