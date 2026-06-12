'use client';

import { useEffect, useRef, useState } from 'react';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { useKioskSession } from '@/lib/kiosk-session';
import { useCamera } from '@/lib/camera-context';

const IDLE_MS = 45_000;
const AUTO_RESET_MS = 15_000;

/** 45s no-touch → "Still there?" → auto-reset after 15s more. */
export function IdleSheet() {
  const { step, goWelcome } = useKioskSession();
  const { stopCamera } = useCamera();
  const [showSheet, setShowSheet] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (step === 'welcome') {
      setShowSheet(false);
      return;
    }

    const bump = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (resetRef.current) clearTimeout(resetRef.current);
      setShowSheet(false);
      timerRef.current = setTimeout(() => setShowSheet(true), IDLE_MS);
    };

    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, bump));
    bump();

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, [step]);

  useEffect(() => {
    if (!showSheet) return;
    resetRef.current = setTimeout(() => {
      stopCamera();
      goWelcome();
      setShowSheet(false);
    }, AUTO_RESET_MS);
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, [showSheet, goWelcome, stopCamera]);

  if (!showSheet) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface-elevated p-8 flex flex-col items-center gap-6">
      <p className="font-body text-k-sub text-content-primary">Still there?</p>
      <AtelierButton
        variant="primary"
        onClick={() => {
          setShowSheet(false);
          if (resetRef.current) clearTimeout(resetRef.current);
        }}
      >
        Continue
      </AtelierButton>
    </div>
  );
}
