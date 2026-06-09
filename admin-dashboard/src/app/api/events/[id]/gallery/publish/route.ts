import { NextResponse } from 'next/server';
import { API, adminHeaders } from '@/lib/api';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${API}/events/${params.id}/gallery/publish`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to publish gallery' }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${API}/events/${params.id}/gallery/publish`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to unpublish gallery' }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
