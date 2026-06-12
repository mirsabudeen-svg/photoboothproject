'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { AssistantLauncher } from '@/components/assistant/AssistantLauncher';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const isPublic = pathname === '/login' || pathname.startsWith('/gallery');

  if (isPublic) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-60 flex min-h-screen flex-1 flex-col">
          <div className="sticky top-0 z-30 flex items-center justify-end border-b border-border bg-surface px-8 py-3">
            <AssistantLauncher />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ToastProvider>
  );
}
