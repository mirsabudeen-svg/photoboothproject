'use client';

import { motion } from 'framer-motion';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { settleIn } from '@/lib/motion';
import { getEventLine } from '@/lib/event-config';
import { useKioskSession } from '@/lib/kiosk-session';
import { useCamera } from '@/lib/camera-context';

export function SuccessScreen() {
  const { event, goWelcome } = useKioskSession();
  const { stopCamera } = useCamera();

  const handleDone = () => {
    stopCamera();
    goWelcome();
  };

  return (
    <ScreenShell eventLine={getEventLine(event)} footLine="Thank you">
      <motion.div {...settleIn} className="flex flex-col items-center gap-8 text-center">
        <h2 className="font-display italic text-k-heading text-content-display">
          Yours to keep
        </h2>
        <p className="font-body text-k-body text-content-secondary max-w-md">
          Thank you for sharing this moment with {event.brideName} and {event.groomName}
        </p>
        <AtelierButton variant="primary" onClick={handleDone}>
          Return to Welcome
        </AtelierButton>
      </motion.div>
    </ScreenShell>
  );
}
