'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Camera } from 'lucide-react';

export interface GalleryEventInfo {
  name: string;
  theme: string;
  primaryColor: string;
}

export function GalleryHeader({
  event,
  totalCaptures,
}: {
  event: GalleryEventInfo;
  totalCaptures: number;
}) {
  const reduceMotion = useReducedMotion();
  const color = event.primaryColor ?? '#D4A843';

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-10 text-center border-b border-border"
      style={{ borderColor: `${color}33` }}
    >
      <div className="flex justify-center mb-3">
        <Camera className="w-6 h-6" style={{ color }} />
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-light mb-2" style={{ color }}>
        {event.name}
      </h1>
      <p className="text-text-muted font-sans text-sm">
        {totalCaptures} {totalCaptures === 1 ? 'memory' : 'memories'} captured · Tap any photo to download
      </p>
    </motion.header>
  );
}
