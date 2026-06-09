'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { X, Download, Share2 } from 'lucide-react';

export interface GalleryCaptureItem {
  id: string;
  type: string;
  thumbnailUrl: string;
  fullUrl: string;
  capturedAt: string;
}

const BATCH_SIZE = 20;

export function GalleryGrid({
  captures,
  primaryColor = '#D4A843',
  galleryToken,
  eventId,
}: {
  captures: GalleryCaptureItem[];
  primaryColor?: string;
  galleryToken?: string;
  eventId?: string;
}) {
  const [selected, setSelected] = useState<GalleryCaptureItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [captures]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, captures.length));
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [captures.length, visibleCount]);

  const downloadHref = useCallback(
    (capture: GalleryCaptureItem) => {
      if (galleryToken && eventId) {
        const key = new URL(capture.fullUrl).pathname.replace(/^\//, '');
        return `/api/gallery/download?key=${encodeURIComponent(key)}&token=${encodeURIComponent(galleryToken)}&eventId=${encodeURIComponent(eventId)}`;
      }
      return capture.fullUrl;
    },
    [eventId, galleryToken],
  );

  if (captures.length === 0) {
    return (
      <p className="text-center text-text-muted font-sans py-16">
        Photos will appear here as guests capture them.
      </p>
    );
  }

  const visible = captures.slice(0, visibleCount);

  return (
    <>
      <div className="p-4 md:p-8 columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {visible.map((capture, i) => (
          <motion.div
            key={capture.id}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : { delay: Math.min(i * 0.04, 0.8), duration: 0.4 }}
            className="break-inside-avoid cursor-pointer rounded-xl overflow-hidden bg-card border border-border hover:border-gold/40 transition-all"
            onClick={() => setSelected(capture)}
          >
            <Image
              src={capture.thumbnailUrl}
              alt="Guest photo"
              width={400}
              height={capture.type.includes('strip') ? 600 : 400}
              className="w-full h-auto object-cover"
              unoptimized
            />
          </motion.div>
        ))}
      </div>
      {visibleCount < captures.length && <div ref={sentinelRef} className="h-8" aria-hidden />}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Photo lightbox"
              initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduceMotion ? undefined : { scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selected.fullUrl}
                alt="Full size"
                width={1080}
                height={1080}
                className="w-full rounded-xl"
                unoptimized
              />
              <div className="flex gap-3 mt-4">
                <a
                  href={downloadHref(selected)}
                  download
                  className="flex-1 flex items-center justify-center gap-2 text-base py-3 rounded-xl font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => navigator.share?.({ url: selected.fullUrl })}
                  className="px-4 py-3 bg-card border border-border rounded-xl"
                >
                  <Share2 className="w-4 h-4 text-text-muted" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute -top-3 -right-3 bg-card border border-border rounded-full p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
