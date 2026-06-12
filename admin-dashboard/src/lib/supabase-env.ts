/** Public Supabase client key — supports new publishable key or legacy anon JWT. */
export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
