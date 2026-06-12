// src/components/assistant/AssistantLauncher.tsx
// Drop this into your top bar / layout. Opens the panel; ⌘K / Ctrl+K shortcut.
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
        className="flex items-center gap-2 rounded border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1.5 text-sm text-[#CFCBC2] transition-colors hover:border-[#D4A843]/60 hover:text-[#F0EDE8] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4A843]"
        aria-label="Open assistant"
      >
        <span aria-hidden className="text-[#D4A843]">✦</span>
        Assistant
        <kbd className="rounded border border-[#2A2A2A] px-1 text-[10px] text-[#6B675F]">⌘K</kbd>
      </button>
      <AssistantPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
