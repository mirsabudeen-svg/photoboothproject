'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Camera, Share2, Monitor, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AnalyticsExport } from '@/components/AnalyticsExport';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { prefersReducedMotion } from '@/lib/utils';
import type { DashboardStats } from '@/app/api/dashboard/stats/route';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  change?: string;
  live?: boolean;
}

function StatCard({ label, value, icon: Icon, change, live }: StatCardProps) {
  const numberRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    if (!numberRef.current) return;
    if (prefersReducedMotion()) {
      numberRef.current.textContent = value.toLocaleString();
      return;
    }
    const counter = { val: 0 };
    gsap.to(counter, {
      val: value,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate() {
        if (numberRef.current) {
          numberRef.current.textContent = Math.round(counter.val).toLocaleString();
        }
      },
    });
  }, { dependencies: [value] });

  return (
    <Card className="stat-card relative overflow-hidden">
      {live && (
        <span className="absolute top-4 right-4">
          <Badge variant="live">Live</Badge>
        </span>
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm font-sans mb-3">{label}</p>
          <p className="text-4xl font-display font-light text-text-primary">
            <span ref={numberRef}>0</span>
          </p>
          {change && <p className="text-xs text-text-muted mt-2 font-sans">{change}</p>}
        </div>
        <div className="w-10 h-10 bg-gold-muted rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-gold" />
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats>({
    captures: 0,
    shares: 0,
    devices: 0,
    sessions: 0,
    events: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    }

    loadStats();

    if (!isSupabaseConfigured() || !supabase) return;

    const client = supabase;
    const channel = client
      .channel('dashboard-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'captures' },
        () => setStats((prev) => ({ ...prev, captures: prev.captures + 1, sessions: prev.sessions + 1 })),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shares' },
        () => setStats((prev) => ({ ...prev, shares: prev.shares + 1 })),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        async () => {
          const { count } = await client.from('devices').select('*', { count: 'exact', head: true });
          if (count != null) setStats((prev) => ({ ...prev, devices: count }));
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from('.stat-card', {
      y: 24,
      autoAlpha: 0,
      stagger: 0.08,
      duration: 0.7,
      ease: 'power2.out',
    });
    gsap.from('.section-header', {
      y: 12,
      autoAlpha: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      <div className="section-header mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-light text-text-primary">Dashboard</h1>
          <p className="text-text-muted font-sans mt-1">Live event operations overview</p>
        </div>
        <AnalyticsExport targetRef={analyticsRef} eventName="Photobooth Operations" />
      </div>

      <div ref={analyticsRef} className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        <div data-testid="stat-card-captures"><StatCard label="Total Captures" value={stats.captures} icon={Camera} live /></div>
        <div data-testid="stat-card-shares"><StatCard label="Shares Sent" value={stats.shares} icon={Share2} /></div>
        <div data-testid="stat-card-devices"><StatCard label="Active Devices" value={stats.devices} icon={Monitor} live /></div>
        <div data-testid="stat-card-events"><StatCard label="Active Events" value={stats.events} icon={CalendarDays} /></div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-text-primary">Quick actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/events/new"
            className="px-5 py-2.5 rounded-xl bg-gold text-base text-sm font-sans font-medium hover:bg-gold/90 shadow-gold"
          >
            Create Event
          </Link>
          <Link
            href="/devices/pair"
            className="px-5 py-2.5 rounded-xl border border-border text-text-muted text-sm font-sans hover:border-gold/40 hover:text-text-primary"
          >
            Pair Device
          </Link>
        </div>
      </Card>
    </div>
  );
}
