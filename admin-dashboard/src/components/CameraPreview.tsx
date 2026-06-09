'use client';

import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type CameraFacing = 'user' | 'environment';

export function CameraPreview({ onCapture }: { onCapture?: (imageSrc: string) => void }) {
  const webcamRef = useRef<Webcam>(null);
  const [facing, setFacing] = useState<CameraFacing>('user');
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot();
    if (src) {
      setSnapshot(src);
      onCapture?.(src);
    }
  }, [onCapture]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-[4/3] bg-base">
        <AnimatePresence mode="wait">
          {!snapshot ? (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.95}
                videoConstraints={{ width: 1280, height: 960, facingMode: facing }}
                onUserMediaError={(e) => setError(String(e))}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border border-gold/20 rounded-lg" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={snapshot} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setSnapshot(null)}
                className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-base/80">
            <p className="text-red-400 text-sm font-sans px-4 text-center">{error}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
        >
          <RefreshCw className="w-4 h-4" /> Flip
        </Button>
        <Button size="sm" type="button" onClick={capture} className="flex-1">
          <Camera className="w-4 h-4" /> Test Capture
        </Button>
      </div>
    </Card>
  );
}
