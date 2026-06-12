import type { EventConfig } from '../event-config';
import type { DeviceCredentials } from '../credentials';

export interface RemoteEventConfig {
  eventId: string;
  eventName: string;
  eventType: string;
  config: Record<string, unknown>;
  serverVersion: number;
}

export async function fetchEventConfig(
  c: DeviceCredentials,
  eventId: string,
): Promise<RemoteEventConfig | null> {
  const res = await fetch(`${c.apiBaseUrl}/events/${eventId}/config`, {
    headers: { Authorization: `Bearer ${c.accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export function mapRemoteToEventConfig(
  remote: RemoteEventConfig,
  fallbackConsent: string,
): EventConfig {
  const cfg = remote.config ?? {};
  return {
    eventId: remote.eventId,
    eventName: remote.eventName,
    brideName: (cfg.brideName as string) ?? 'Guest',
    groomName: (cfg.groomName as string) ?? 'Guest',
    hashtag: (cfg.hashtag as string) ?? '',
    themeId: (cfg.themeId as string) ?? 'luxury_gold',
    consentText: (cfg.consentText as string) ?? fallbackConsent,
    readinessMode: cfg.readinessMode === 'auto' ? 'auto' : 'manual',
  };
}
