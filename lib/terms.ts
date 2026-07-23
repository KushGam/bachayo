import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

export const CURRENT_TERMS_VERSION = 'v1.0';

const TERMS_CACHE_PREFIX = 'terms_accepted';

function termsCacheKey(userId: string) {
  return `${TERMS_CACHE_PREFIX}:${CURRENT_TERMS_VERSION}:${userId}`;
}

/** Device-local flag so accepted terms are not shown again on this phone. */
export async function markTermsAcceptedLocally(userId: string) {
  await AsyncStorage.setItem(termsCacheKey(userId), new Date().toISOString());
}

export async function hasTermsAcceptedLocally(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(termsCacheKey(userId));
  return Boolean(value);
}

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

/** True when the user accepted the current terms (local cache or Supabase profile). */
export async function hasAcceptedTerms(userId: string): Promise<boolean> {
  if (await hasTermsAcceptedLocally(userId)) {
    return true;
  }

  const acceptedAt = await fetchTermsAcceptedAt(userId);
  if (acceptedAt) {
    await markTermsAcceptedLocally(userId);
    return true;
  }

  return false;
}

export async function recordTermsAcceptance(userId: string) {
  const payload = {
    terms_accepted_at: new Date().toISOString(),
    terms_version: CURRENT_TERMS_VERSION,
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload as never)
    .eq('id', userId)
    .select('id, terms_accepted_at')
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    // Profile row missing — upsert so Google / legacy sessions can still continue
    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...payload } as never)
      .select('id, terms_accepted_at')
      .maybeSingle();

    if (upsertError) {
      return { data: null, error: upsertError };
    }

    await markTermsAcceptedLocally(userId);
    return { data: upserted, error: null };
  }

  await markTermsAcceptedLocally(userId);
  return { data, error: null };
}

export function termsAcceptanceFields(accepted: boolean) {
  if (!accepted) return {};
  return {
    terms_accepted_at: new Date().toISOString(),
    terms_version: CURRENT_TERMS_VERSION,
  };
}
