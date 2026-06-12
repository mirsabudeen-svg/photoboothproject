import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

const TTL_MS = 5 * 60_000;

export interface ConfirmPayload {
  tool: string;
  args: unknown;
  userId: string;
  exp: number;
}

function secret(): string {
  return (
    process.env.ASSISTANT_CONFIRM_SECRET ??
    process.env.ADMIN_API_KEY ??
    ''
  );
}

export function signConfirmToken(payload: Omit<ConfirmPayload, 'exp'> & { exp?: number }): string {
  const key = secret();
  if (!key) throw new Error('ASSISTANT_CONFIRM_SECRET or ADMIN_API_KEY required for confirmations');
  const body: ConfirmPayload = {
    ...payload,
    exp: payload.exp ?? Date.now() + TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = createHmac('sha256', key).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyConfirmToken(
  token: string,
  expected: { tool: string; args: unknown; userId: string },
): boolean {
  const key = secret();
  if (!key) return false;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return false;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = createHmac('sha256', key).update(encoded).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  let payload: ConfirmPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ConfirmPayload;
  } catch {
    return false;
  }
  if (payload.exp < Date.now()) return false;
  if (payload.tool !== expected.tool) return false;
  if (payload.userId !== expected.userId) return false;
  return JSON.stringify(payload.args) === JSON.stringify(expected.args);
}
