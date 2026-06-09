'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GalleryQrCode } from '@/components/GalleryQrCode';

interface EventDetail {
  event: {
    id: string;
    name: string;
    eventType: string;
    isActive: boolean;
    config: Record<string, unknown>;
    createdAt: string;
    galleryPublishedAt: string | null;
    galleryUrl: string | null;
    galleryToken: string;
  };
  stats: { captures: number; shares: number; sessions: number; leads: number };
  devices: Array<{ id: string; name: string; model: string; lastSeenAt: string | null }>;
  recentCaptures: Array<{ id: string; thumbKey: string | null; type: string; createdAt: string }>;
  shareBreakdown: Record<string, number>;
  shareStatusBreakdown?: Record<string, { sent: number; delivered: number; failed: number }>;
  retention: { retentionDays: number; recordsToDelete: number };
}

function isDeviceLive(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 2 * 60 * 1000;
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const posthog = usePostHog();
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/events/${params.id}/detail`);
    if (!res.ok) {
      setError('Failed to load event');
      return;
    }
    setDetail(await res.json());
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function publishGallery() {
    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/events/${params.id}/gallery/publish`, { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      posthog?.capture('gallery_published', {
        eventId: params.id,
        captureCount: detail?.stats.captures ?? 0,
      });
      await load();
      if (data.galleryUrl) {
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                event: {
                  ...prev.event,
                  galleryPublishedAt: new Date().toISOString(),
                  galleryUrl: data.galleryUrl,
                },
              }
            : prev,
        );
      }
    } finally {
      setGalleryLoading(false);
    }
  }

  async function unpublishGallery() {
    setGalleryLoading(true);
    try {
      await fetch(`/api/events/${params.id}/gallery/publish`, { method: 'DELETE' });
      await load();
    } finally {
      setGalleryLoading(false);
    }
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!detail) return <p className="text-text-muted">Loading event…</p>;

  const { event, stats, devices, recentCaptures, shareBreakdown, shareStatusBreakdown, retention } = detail;

  async function copyGalleryLink() {
    if (!event.galleryUrl) return;
    await navigator.clipboard.writeText(event.galleryUrl);
  }

  return (
    <div className="space-y-8" data-testid="event-detail-page">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl font-light text-text-primary">{event.name}</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant={event.isActive ? 'live' : 'offline'}>{event.isActive ? 'Active' : 'Inactive'}</Badge>
            <Badge variant="draft">{String(event.config?.themeId ?? 'default theme')}</Badge>
          </div>
        </div>
        <Link href="/events">
          <Button variant="ghost">Back to events</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <Card><p className="text-text-muted text-sm">Captures</p><p className="text-3xl font-display">{stats.captures}</p></Card>
        <Card><p className="text-text-muted text-sm">Shares</p><p className="text-3xl font-display">{stats.shares}</p></Card>
        <Card><p className="text-text-muted text-sm">Sessions</p><p className="text-3xl font-display">{stats.sessions}</p></Card>
        <Card><p className="text-text-muted text-sm">Leads</p><p className="text-3xl font-display">{stats.leads}</p></Card>
      </div>

      <Card>
        <h2 className="font-display text-xl text-text-primary mb-4">Guest Gallery</h2>
        {event.galleryPublishedAt && event.galleryUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Published · {stats.captures} photos visible
            </div>
            <GalleryQrCode url={event.galleryUrl} />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={copyGalleryLink}>
                Copy gallery link
              </Button>
            </div>
            <p className="text-xs text-text-muted">Share this QR at the event or send the link directly.</p>
            <Button variant="danger" size="sm" loading={galleryLoading} onClick={unpublishGallery}>
              Unpublish Gallery
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-text-muted text-sm">Gallery is private. Publish to give guests access.</p>
            <Button loading={galleryLoading} onClick={publishGallery} data-testid="publish-gallery">
              Publish Gallery
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-2xl mb-4">Devices</h2>
        {devices.length === 0 ? (
          <p className="text-text-muted text-sm">No devices assigned</p>
        ) : (
          <ul className="space-y-2">
            {devices.map((d) => (
              <li key={d.id} className="text-sm font-sans text-text-primary flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isDeviceLive(d.lastSeenAt) ? 'bg-green-400 animate-pulse' : 'bg-amber-500'}`}
                  title={isDeviceLive(d.lastSeenAt) ? 'Live' : 'Offline'}
                />
                {d.name} ({d.model})
                {d.lastSeenAt && (
                  <span className="text-text-muted text-xs">
                    last seen {new Date(d.lastSeenAt).toLocaleTimeString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-2xl mb-4">Recent captures</h2>
        <div className="grid grid-cols-4 gap-3">
          {recentCaptures.map((c) => (
            <div key={c.id} className="aspect-square bg-surface rounded-lg border border-border flex items-center justify-center text-xs text-text-muted">
              {c.type}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-2xl mb-4">Share channels</h2>
        <ul className="space-y-2 text-sm font-sans">
          {Object.entries(shareBreakdown).map(([channel, count]) => {
            const status = shareStatusBreakdown?.[channel];
            return (
              <li key={channel}>
                <span className="text-text-primary">{channel}: {count}</span>
                {status && (
                  <span className="ml-2 text-xs">
                    <span className="text-amber-400">sent {status.sent}</span>
                    {' · '}
                    <span className="text-green-400">delivered {status.delivered}</span>
                    {status.failed > 0 && (
                      <>
                        {' · '}
                        <span className="text-red-400">failed {status.failed}</span>
                      </>
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="font-display text-2xl mb-2">Retention</h2>
        <p className="text-text-muted text-sm">{retention.retentionDays} day policy · {retention.recordsToDelete} records tracked</p>
      </Card>
    </div>
  );
}
