import { createSupabaseServerClient } from './supabase-server';

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AdminSession {
  userId: string;
  email?: string;
}

/** Same gate as /api/ai/generate — Supabase session required when configured. */
export async function requireAdminSession(): Promise<AdminSession> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    if (process.env.NODE_ENV === 'development') {
      return { userId: 'dev-local', email: 'dev@local' };
    }
    throw new AuthError('Authentication not configured');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new AuthError();
  }

  return {
    userId: session.user.id,
    email: session.user.email,
  };
}
