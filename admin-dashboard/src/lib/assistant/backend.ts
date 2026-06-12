// Server-only helper: calls the NestJS backend with the admin key attached.
// The key NEVER reaches the browser or the LLM — it lives only in this module.

import 'server-only';

const BASE =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3000/api/v1';
const ADMIN_KEY = process.env.ADMIN_API_KEY ?? '';

export function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!ADMIN_KEY) {
    return Promise.reject(
      new Error('ADMIN_API_KEY is not configured on the admin server'),
    );
  }
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Api-Key': ADMIN_KEY,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
}

/** Convenience: GET + JSON with a ToolError on non-2xx. */
export async function backendJson<T = unknown>(path: string): Promise<T> {
  const res = await backendFetch(path);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Backend ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}
