'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { flash } from '@/lib/motion';
import { useCamera } from '@/lib/camera-context';
import { dataUrlToBlob } from '@/lib/data-url';
import { useDeviceSession } from '@/lib/device-session';
import { enqueueCapture } from '@/lib/queue/enqueue';
import { useKioskSession } from '@/lib/kiosk-session';

export function CaptureScreen({ onCaptured }: { onCaptured: (url: string) => void }) {
  const { captureFrame } = useCamera();
  const { event, setCapturedUrl, setCaptureJobId } = useKioskSession();
  const { apiEnabled } = useDeviceSession();
  const [flashing, setFlashing] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => {
      void (async () => {
        const url = captureFrame();
        if (!url) return;
        setCapturedUrl(url);
        if (apiEnabled) {
          try {
            const blob = await dataUrlToBlob(url);
            const jobId = await enqueueCapture(blob, event.eventId);
            setCaptureJobId(jobId);
          } catch {
            // Preview still works; delivery shows local-only state
          }
        }
        onCaptured(url);
      })();
    }, 90);
    const t2 = setTimeout(() => setFlashing(false), 120);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [captureFrame, onCaptured, setCapturedUrl, setCaptureJobId, event.eventId, apiEnabled]);

  if (!flashing) return null;

  return (
    <motion.div
      {...flash}
      className="fixed inset-0 z-50 bg-[#FAF8F3] pointer-events-none"
      aria-hidden
    />
  );
}
