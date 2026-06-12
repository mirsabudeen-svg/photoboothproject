import type { EventConfig } from './event-config';

const KEY = 'wpb.event.v1';

export interface CachedEvent {
  config: EventConfig;
  serverVersion: number;
  fetchedAt: number;
}

export const eventCache = {
  load: (): CachedEvent | null => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? 'null') as CachedEvent | null;
    } catch {
      return null;
    }
  },
  save: (entry: CachedEvent) => {
    localStorage.setItem(KEY, JSON.stringify(entry));
  },
  clear: () => {
    localStorage.removeItem(KEY);
  },
};
