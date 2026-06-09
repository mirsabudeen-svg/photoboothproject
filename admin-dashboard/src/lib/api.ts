const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const ADMIN_KEY = process.env.ADMIN_API_KEY ?? '';

export function adminHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADMIN_KEY) headers['x-admin-api-key'] = ADMIN_KEY;
  return headers;
}

export async function fetchEvents() {
  const res = await fetch(`${API}/events`, { cache: 'no-store', headers: adminHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchEventStats(eventId: string) {
  const res = await fetch(`${API}/events/${eventId}/stats`, {
    cache: 'no-store',
    headers: adminHeaders(),
  });
  if (!res.ok) return { captureCount: 0, shareCount: 0 };
  return res.json() as Promise<{ captureCount: number; shareCount: number }>;
}

export async function backendFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...adminHeaders(), ...init?.headers },
  });
  if (!res.ok) throw new Error(`Backend ${path} failed: ${res.status}`);
  return res.json();
}

export { API };
