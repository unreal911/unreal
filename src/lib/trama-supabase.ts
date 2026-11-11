import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_TRAMA_SUPABASE_URL?.trim();
const key = import.meta.env.PUBLIC_TRAMA_SUPABASE_ANON_KEY?.trim();

export const tramaSupabaseConfigured = Boolean(url && key);

export function createTramaClient(persistSession = true) {
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      storageKey: persistSession ? 'trama-admin-auth' : 'trama-catalog-auth',
      persistSession,
      autoRefreshToken: persistSession,
      detectSessionInUrl: false,
    },
  });
}
