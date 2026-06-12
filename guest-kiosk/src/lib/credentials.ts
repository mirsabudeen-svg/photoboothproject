const KEY = 'wpb.device.v1';

export interface DeviceCredentials {
  deviceId: string;
  accessToken: string;
  tokenExpiresAt: string;
  apiBaseUrl: string;
}

export const credentials = {
  load: (): DeviceCredentials | null => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? 'null') as DeviceCredentials | null;
    } catch {
      return null;
    }
  },
  save: (c: DeviceCredentials) => {
    localStorage.setItem(KEY, JSON.stringify(c));
  },
  clear: () => {
    localStorage.removeItem(KEY);
  },
  nearExpiry: (c: DeviceCredentials, days = 14) =>
    new Date(c.tokenExpiresAt).getTime() - Date.now() < days * 86_400_000,
};

export function defaultApiBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  return url || null;
}
