import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const detail = await backendFetch(`/events/${params.id}/detail`);
    return NextResponse.json(detail);
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
