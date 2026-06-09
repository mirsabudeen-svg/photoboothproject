'use client';

import { useRef } from 'react';
import { DashboardPage } from '@/components/dashboard/DashboardPage';

export default function AnalyticsPage() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-light text-text-primary">Analytics</h1>
        <p className="text-text-muted font-sans mt-1">Event performance and export</p>
      </div>
      <DashboardPage />
    </div>
  );
}
