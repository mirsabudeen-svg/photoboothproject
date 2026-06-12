import type { DeviceCredentials } from '../credentials';

export type PairResult =
  | { ok: true; deviceId: string; accessToken: string; tokenExpiresAt: string }
  | { ok: false; status: number };

export async function pairDevice(
  baseUrl: string,
  pairingCode: string,
  deviceName: string,
): Promise<PairResult> {
  const model = `web/${navigator.userAgent.includes('Android') ? 'android-tablet' : 'browser'}`;
  const res = await fetch(`${baseUrl}/devices/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pairingCode,
      deviceName: deviceName || 'Web Kiosk',
      deviceModel: model,
    }),
  });
  if (!res.ok) return { ok: false as const, status: res.status };
  const body = await res.json();
  return {
    ok: true as const,
    deviceId: body.deviceId,
    accessToken: body.accessToken,
    tokenExpiresAt: body.tokenExpiresAt ?? body.expiresAt,
  };
}

export async function refreshToken(
  c: DeviceCredentials,
): Promise<{ accessToken: string; tokenExpiresAt: string } | null> {
  const res = await fetch(`${c.apiBaseUrl}/devices/token/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.accessToken}` },
  });
  if (!res.ok) return null;
  const body = await res.json();
  return {
    accessToken: body.accessToken,
    tokenExpiresAt: body.tokenExpiresAt ?? body.expiresAt,
  };
}
