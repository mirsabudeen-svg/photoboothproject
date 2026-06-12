import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseEnvConfigured } from './supabase-env';

export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

export const supabase = createSupabaseBrowserClient();

export function isSupabaseConfigured(): boolean {
  return isSupabaseEnvConfigured();
}
