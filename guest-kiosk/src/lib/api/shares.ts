import type { DeviceCredentials } from '../credentials';

export async function createSmsShare(
  c: DeviceCredentials,
  captureId: string,
  destination: string,
  idempotencyKey: string,
): Promise<{ ok: boolean; status: number }> {
  const res = await fetch(`${c.apiBaseUrl}/shares`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.accessToken}`,
    },
    body: JSON.stringify({
      captureId,
      channel: 'SMS',
      destination,
      idempotencyKey,
    }),
  });
  return { ok: res.ok, status: res.status };
}
