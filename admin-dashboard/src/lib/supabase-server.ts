import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabasePublishableKey, getSupabaseUrl } from './supabase-env';

export function createSupabaseServerClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) return null;

  const cookieStore = cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component — cookie writes may fail; middleware handles refresh
        }
      },
    },
  });
}
