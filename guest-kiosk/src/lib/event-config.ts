export interface EventConfig {
  eventId: string;
  eventName: string;
  brideName: string;
  groomName: string;
  hashtag: string;
  themeId: string;
  consentText: string;
  readinessMode: 'manual' | 'auto';
}

export const DEMO: EventConfig = {
  eventId: 'demo-wedding',
  eventName: 'Aisha & Omar',
  brideName: 'Aisha',
  groomName: 'Omar',
  hashtag: '#AishaAndOmar',
  themeId: 'luxury_gold',
  consentText:
    'I consent to having my photo taken at this event and understand images may be shared with other guests.',
  readinessMode: 'manual',
};

export function getEventLine(config: EventConfig): string {
  return `${config.brideName} & ${config.groomName} · The Atelier`;
}

export async function loadEventConfig(): Promise<EventConfig> {
  const api = process.env.NEXT_PUBLIC_API_URL;
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  if (!api || !eventId) return DEMO;

  try {
    const res = await fetch(`${api}/events/${eventId}/config`, { cache: 'no-store' });
    if (!res.ok) return DEMO;
    const data = await res.json();
    const cfg = data.config ?? data;
    return {
      eventId,
      eventName: data.name ?? `${cfg.brideName ?? 'Guest'} & ${cfg.groomName ?? 'Guest'}`,
      brideName: cfg.brideName ?? 'Guest',
      groomName: cfg.groomName ?? 'Guest',
      hashtag: cfg.hashtag ?? '',
      themeId: cfg.themeId ?? 'luxury_gold',
      consentText: cfg.consentText ?? DEMO.consentText,
      readinessMode: cfg.readinessMode === 'auto' ? 'auto' : 'manual',
    };
  } catch {
    return DEMO;
  }
}
