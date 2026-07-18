import { supabase } from '@/lib/supabase';

export const CURRENT_TERMS_VERSION = 'v1.0';

export async function fetchTermsAcceptedAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('terms_accepted_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[terms] fetch failed:', error.message);
    return null;
  }

  const value = (data as { terms_accepted_at?: string | null } | null)?.terms_accepted_at;
  return value ?? null;
}

export async function recordTermsAcceptance(userId: string) {
  return supabase
    .from('profiles')
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: CURRENT_TERMS_VERSION,
    } as never)
    .eq('id', userId);
}

export function termsAcceptanceFields(accepted: boolean) {
  if (!accepted) return {};
  return {
    terms_accepted_at: new Date().toISOString(),
    terms_version: CURRENT_TERMS_VERSION,
  };
}
