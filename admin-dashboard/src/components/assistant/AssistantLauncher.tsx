'use client';

import { useEffect, useState } from 'react';
import { AssistantPanel } from './AssistantPanel';

export function AssistantLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded border border-border bg-surface px-3 py-1.5 text-sm text-text-primary transition-colors hover:border-gold/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
        aria-label="Open assistant"
      >
        <span aria-hidden className="text-gold">
          ✦
        </span>
        Assistant
        <kbd className="rounded border border-border px-1 text-[10px] text-text-muted">⌘K</kbd>
      </button>
      <AssistantPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
