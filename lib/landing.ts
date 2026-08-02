import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchUserRole } from '@/lib/auth';
import { getTabsRouteForRole, resolveAuthenticatedRoute } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { hasAcceptedTerms } from '@/lib/terms';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types/database';

export const SEEN_LANDING_KEY = 'seen_landing';

const SESSION_TIMEOUT_MS = 8000;
const ROLE_TIMEOUT_MS = 10000;

export type DeviceLocale = 'en' | 'np';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function resolveRoleWithFallback(userId: string): Promise<UserRole | null> {
  try {
    return await withTimeout(fetchUserRole(userId), ROLE_TIMEOUT_MS, 'fetchUserRole');
  } catch (error) {
    console.warn('[boot] fetchUserRole failed — trying partner fallback:', error);

    try {
      const { data, error: partnerError } = await withTimeout(
        supabase.from('partners').select('id').eq('user_id', userId).maybeSingle(),
        4000,
        'partners.lookup',
      );

      if (!partnerError && data) {
        return 'partner';
      }
    } catch (partnerLookupError) {
      console.warn('[boot] partner fallback failed:', partnerLookupError);
    }

    return null;
  }
}

export async function hasSeenLanding() {
  const value = await AsyncStorage.getItem(SEEN_LANDING_KEY);
  return value === 'true';
}

export async function markLandingSeen() {
  await AsyncStorage.setItem(SEEN_LANDING_KEY, 'true');
}

export function getDeviceLocale(): DeviceLocale {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase() ?? 'en';
    if (locale.startsWith('ne') || locale.includes('-np') || locale === 'np') {
      return 'np';
    }
    return 'en';
  } catch {
    return 'en';
  }
}

async function routeWithoutSession() {
  useAuthStore.getState().setAuthRole(null);

  if (await hasSeenLanding()) {
    return '/(auth)/welcome';
  }

  return '/(landing)';
}

export async function resolveInitialRoute(): Promise<string> {
  if (__DEV__) console.log('[boot] resolveInitialRoute start');

  let userId: string | undefined;

  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_TIMEOUT_MS,
      'supabase.auth.getSession',
    );

    if (error) {
      console.error('[boot] getSession error:', error.message);
      return routeWithoutSession();
    }

    userId = data.session?.user?.id;
    if (__DEV__) console.log('[boot] session user:', userId ? 'yes' : 'no');

    if (!userId) {
      return routeWithoutSession();
    }
  } catch (error) {
    console.error('[boot] getSession failed:', error);
    return routeWithoutSession();
  }

  const role = await resolveRoleWithFallback(userId);
  useAuthStore.getState().setAuthRole(role);
  if (__DEV__) console.log('[boot] resolved role:', role ?? 'none (deferred)');

  try {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (profileRow) {
      const accepted = await hasAcceptedTerms(userId);
      if (!accepted) {
        if (__DEV__) console.log('[boot] terms not accepted — routing to accept-terms');
        return '/(auth)/accept-terms';
      }

      if (role === 'customer') {
        const { data: onboardingRow } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', userId)
          .maybeSingle();
        const completed = (onboardingRow as { onboarding_completed?: boolean | null } | null)
          ?.onboarding_completed;
        if (completed === false) {
          if (__DEV__) console.log('[boot] customer onboarding incomplete');
          return '/(onboarding)/customer';
        }
      }
    }

    return resolveAuthenticatedRoute(userId, role);
  } catch (error) {
    console.error('[boot] resolveAuthenticatedRoute failed:', error);
    return getTabsRouteForRole(role);
  }
}
