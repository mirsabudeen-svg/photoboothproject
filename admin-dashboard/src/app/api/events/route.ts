import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const ADMIN_KEY = process.env.ADMIN_API_KEY ?? '';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${API}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ADMIN_KEY ? { 'x-admin-api-key': ADMIN_KEY } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
