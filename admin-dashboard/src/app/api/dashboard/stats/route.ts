import { NextResponse } from 'next/server';
import { adminHeaders, API } from '@/lib/api';

export interface DashboardStats {
  captures: number;
  shares: number;
  devices: number;
  sessions: number;
  events: number;
}

export async function GET() {
  try {
    const [eventsRes, devicesRes] = await Promise.all([
      fetch(`${API}/events`, { cache: 'no-store', headers: adminHeaders() }),
      fetch(`${API}/devices`, { cache: 'no-store', headers: adminHeaders() }),
    ]);

    const events = eventsRes.ok ? await eventsRes.json() : [];
    const devices = devicesRes.ok ? await devicesRes.json() : [];

    let captures = 0;
    let shares = 0;
    await Promise.all(
      (events as Array<{ id: string }>).map(async (event) => {
        const statsRes = await fetch(`${API}/events/${event.id}/stats`, {
          cache: 'no-store',
          headers: adminHeaders(),
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          captures += stats.captureCount ?? 0;
          shares += stats.shareCount ?? 0;
        }
      }),
    );

    const stats: DashboardStats = {
      captures,
      shares,
      devices: devices.length,
      sessions: captures,
      events: events.length,
    };

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { captures: 0, shares: 0, devices: 0, sessions: 0, events: 0 },
      { status: 200 },
    );
  }
}
