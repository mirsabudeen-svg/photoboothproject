'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';
import { CameraPrep } from '@/components/capture/CameraPrep';
import { CaptureScreen } from '@/components/screens/CaptureScreen';
import { CountdownScreen } from '@/components/screens/CountdownScreen';
import { DeliveryScreen } from '@/components/screens/DeliveryScreen';
import { EnhancementScreen } from '@/components/screens/EnhancementScreen';
import { ExperienceScreen } from '@/components/screens/ExperienceScreen';
import { LayoutScreen } from '@/components/screens/LayoutScreen';
import { PersonalizationScreen } from '@/components/screens/PersonalizationScreen';
import { PrintQueueScreen } from '@/components/screens/PrintQueueScreen';
import { ReviewScreen } from '@/components/screens/ReviewScreen';
import { SuccessScreen } from '@/components/screens/SuccessScreen';
import { WelcomeScreen } from '@/components/screens/WelcomeScreen';
import { IdleSheet } from '@/components/IdleSheet';
import { screenTransition } from '@/lib/motion';
import { useKioskSession } from '@/lib/kiosk-session';

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...screenTransition} className="min-h-dvh w-full">
      {children}
    </motion.div>
  );
}

export function KioskFlow() {
  const { step, setStep, printRequested } = useKioskSession();

  const onPrepReady = useCallback(() => setStep('countdown'), [setStep]);
  const onCountdownDone = useCallback(() => setStep('capture'), [setStep]);
  const onCaptured = useCallback(() => setStep('review'), [setStep]);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={step} className="min-h-dvh">
        {step === 'welcome' && (
          <Step>
            <WelcomeScreen />
          </Step>
        )}
        {step === 'experience' && (
          <Step>
            <ExperienceScreen />
          </Step>
        )}
        {step === 'prep' && (
          <Step>
            <CameraPrep onReadyConfirmed={onPrepReady} />
          </Step>
        )}
        {step === 'countdown' && (
          <Step>
            <CountdownScreen onComplete={onCountdownDone} />
          </Step>
        )}
        {step === 'capture' && (
          <CaptureScreen onCaptured={onCaptured} />
        )}
        {step === 'review' && (
          <Step>
            <ReviewScreen />
          </Step>
        )}
        {step === 'enhancement' && (
          <Step>
            <EnhancementScreen />
          </Step>
        )}
        {step === 'layout' && (
          <Step>
            <LayoutScreen />
          </Step>
        )}
        {step === 'personalization' && (
          <Step>
            <PersonalizationScreen />
          </Step>
        )}
        {step === 'delivery' && (
          <Step>
            <DeliveryScreen />
          </Step>
        )}
        {step === 'print-queue' && (
          <Step>
            <PrintQueueScreen />
          </Step>
        )}
        {step === 'success' && (
          <Step>
            <SuccessScreen />
          </Step>
        )}
      </motion.div>
      <IdleSheet />
    </AnimatePresence>
  );
}
