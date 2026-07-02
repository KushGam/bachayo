import type { Href, Router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

export function getTabsRouteForRole(role: UserRole | null): Href {
  if (role === 'partner') {
    return '/(tabs)/partner/dashboard';
  }

  return '/(tabs)/customer/home';
}

export async function resolveAuthenticatedRoute(
  userId: string,
  role: UserRole | null,
): Promise<Href> {
  if (role === 'partner') {
    const { data: partner, error } = await supabase
      .from('partners')
      .select('subscription_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && partner?.subscription_status === 'paused') {
      return '/partner/reactivate';
    }

    return '/(tabs)/partner/dashboard';
  }

  return getTabsRouteForRole(role);
}

export function goBackOr(router: Router, fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
