'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { pairDevice, refreshToken } from './api/device';
import { fetchEventConfig, mapRemoteToEventConfig } from './api/event';
import { credentials, defaultApiBaseUrl } from './credentials';
import { DEMO, type EventConfig } from './event-config';
import { eventCache } from './event-cache';
import { drainer } from './queue/drainer';

export type DevicePhase = 'loading' | 'pairing' | 'waiting-event' | 'guest' | 'demo';

export type PairOutcome = { ok: true } | { ok: false; status: number };

interface DeviceSession {
  phase: DevicePhase;
  event: EventConfig;
  apiEnabled: boolean;
  pair: (code: string, name: string) => Promise<PairOutcome>;
  unpair: () => void;
  refreshEventConfig: () => Promise<void>;
}

const DeviceContext = createContext<DeviceSession | null>(null);

function resolveEventId(): string | null {
  return process.env.NEXT_PUBLIC_EVENT_ID?.trim() || null;
}

export function DeviceSessionProvider({ children }: { children: ReactNode }) {
  const apiBaseUrl = defaultApiBaseUrl();
  const apiEnabled = Boolean(apiBaseUrl);
  const [phase, setPhase] = useState<DevicePhase>('loading');
  const [event, setEvent] = useState<EventConfig>(DEMO);

  const applyRemoteConfig = useCallback(
    (remote: Awaited<ReturnType<typeof fetchEventConfig>>) => {
      if (!remote) return false;
      const mapped = mapRemoteToEventConfig(remote, DEMO.consentText);
      setEvent(mapped);
      eventCache.save({
        config: mapped,
        serverVersion: remote.serverVersion,
        fetchedAt: Date.now(),
      });
      return true;
    },
    [],
  );

  const refreshEventConfig = useCallback(async () => {
    const c = credentials.load();
    const eventId = resolveEventId();
    if (!c || !eventId) return;
    const remote = await fetchEventConfig(c, eventId);
    if (remote) {
      applyRemoteConfig(remote);
      setPhase('guest');
    } else if (eventCache.load()) {
      setEvent(eventCache.load()!.config);
      setPhase('guest');
    } else {
      setPhase('waiting-event');
    }
  }, [applyRemoteConfig]);

  const boot = useCallback(async () => {
    if (!apiEnabled) {
      setEvent(DEMO);
      setPhase('demo');
      return;
    }

    let c = credentials.load();
    if (c?.apiBaseUrl !== apiBaseUrl) {
      if (c) credentials.clear();
      c = null;
    }

    if (c && credentials.nearExpiry(c)) {
      const refreshed = await refreshToken(c);
      if (refreshed) {
        c = {
          ...c,
          accessToken: refreshed.accessToken,
          tokenExpiresAt: refreshed.tokenExpiresAt,
        };
        credentials.save(c);
      } else {
        credentials.clear();
        c = null;
      }
    }

    if (!c) {
      setPhase('pairing');
      return;
    }

    drainer.start();
    await refreshEventConfig();
  }, [apiEnabled, apiBaseUrl, refreshEventConfig]);

  useEffect(() => {
    void boot();
  }, [boot]);

  useEffect(() => {
    if (phase !== 'guest' && phase !== 'demo') return;
    if (!apiEnabled) return;

    drainer.start();

    const hourly = setInterval(async () => {
      const c = credentials.load();
      if (!c) return;
      if (credentials.nearExpiry(c)) {
        const refreshed = await refreshToken(c);
        if (refreshed) {
          credentials.save({
            ...c,
            accessToken: refreshed.accessToken,
            tokenExpiresAt: refreshed.tokenExpiresAt,
          });
        } else {
          credentials.clear();
          setPhase('pairing');
        }
      }
    }, 3_600_000);

    const configSync = setInterval(() => {
      void refreshEventConfig();
    }, 15 * 60_000);

    return () => {
      clearInterval(hourly);
      clearInterval(configSync);
    };
  }, [phase, apiEnabled, refreshEventConfig]);

  useEffect(() => {
    const onAuthLost = () => setPhase('pairing');
    window.addEventListener('wpb:auth-lost', onAuthLost);
    return () => window.removeEventListener('wpb:auth-lost', onAuthLost);
  }, []);

  const pair = useCallback(
    async (code: string, name: string): Promise<PairOutcome> => {
      if (!apiBaseUrl) return { ok: false, status: 0 };
      const result = await pairDevice(apiBaseUrl, code, name);
      if (!result.ok) return result;
      credentials.save({
        deviceId: result.deviceId,
        accessToken: result.accessToken,
        tokenExpiresAt: result.tokenExpiresAt,
        apiBaseUrl,
      });
      drainer.start();
      await refreshEventConfig();
      return { ok: true };
    },
    [apiBaseUrl, refreshEventConfig],
  );

  const unpair = useCallback(() => {
    credentials.clear();
    eventCache.clear();
    setPhase('pairing');
  }, []);

  const value = useMemo<DeviceSession>(
    () => ({
      phase,
      event,
      apiEnabled,
      pair,
      unpair,
      refreshEventConfig,
    }),
    [phase, event, apiEnabled, pair, unpair, refreshEventConfig],
  );

  if (phase === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-base">
        <p className="font-meta uppercase tracking-[0.28em] text-k-meta text-state-processing">
          Preparing your atelier…
        </p>
      </div>
    );
  }

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDeviceSession(): DeviceSession {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDeviceSession requires DeviceSessionProvider');
  return ctx;
}
