import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const log = createLogger('Supabase');

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  log.warn(
    'Missing Supabase environment variables. '
    + 'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY '
    + 'in your Vercel Dashboard → Project Settings → Environment Variables.'
  );
}

export const createClerkSupabaseClient = (clerkToken: string): SupabaseClient => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `sb-clerk-${clerkToken.slice(0, 8)}`,
    },
  });
};

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
