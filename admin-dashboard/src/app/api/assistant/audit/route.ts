import { NextResponse } from 'next/server';
import { AuthError, requireAdminSession } from '@/lib/auth';
import { listAuditForUser } from '@/lib/assistant/audit';

export async function GET() {
  try {
    const session = await requireAdminSession();
    const entries = await listAuditForUser(session.userId, 100);
    return NextResponse.json({ entries });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
