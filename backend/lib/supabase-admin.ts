import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function supabaseUrl(): string {
  return process.env.SUPABASE_URL || requireEnv('NEXT_PUBLIC_SUPABASE_URL');
}

export function createSupabaseAdmin() {
  return createClient(supabaseUrl(), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
