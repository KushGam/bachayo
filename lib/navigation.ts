import type { Href, Router } from 'expo-router';

import { getPartnerApprovalStatus, type PartnerApprovalFields } from '@/lib/partnerApproval';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

export function getTabsRouteForRole(role: UserRole | null): Href {
  if (role === 'partner') {
    return '/(tabs)/partner/dashboard';
  }

  return '/(tabs)/customer/home';
}

export async function resolvePartnerRoute(userId: string): Promise<Href> {
  const { data: partner, error } = await supabase
    .from('partners')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !partner) {
    return '/(tabs)/partner/dashboard';
  }

  const approvalRow = partner as PartnerApprovalFields;
  const approvalStatus = getPartnerApprovalStatus(approvalRow);
  if (approvalStatus === 'pending') {
    return '/(auth)/partner-pending';
  }
  if (approvalStatus === 'rejected') {
    return '/(auth)/partner-rejected';
  }
  if (approvalStatus === 'suspended') {
    return '/(auth)/partner-suspended';
  }
  if (approvalStatus === 'deleted') {
    return '/(auth)/partner-deleted';
  }
  if (approvalRow.subscription_status === 'paused') {
    return '/(tabs)/partner/subscription';
  }

  return '/(tabs)/partner/dashboard';
}

export async function resolveAuthenticatedRoute(
  userId: string,
  role: UserRole | null,
): Promise<Href> {
  if (role === 'partner') {
    return resolvePartnerRoute(userId);
  }

  if (role === 'customer') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    const completed = (profile as { onboarding_completed?: boolean | null } | null)
      ?.onboarding_completed;
    if (completed === false) {
      return '/(onboarding)/customer' as Href;
    }
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

/**
 * Leave any modal presentation (bag/reserve sheets) before navigating.
 * Without this, replace() can render the next screen *inside* the modal,
 * causing a "screen under screen" stack (home sheet over home tabs).
 */
export function dismissModalsAndReplace(router: Router, href: Href) {
  try {
    if (typeof router.canDismiss === 'function' && router.canDismiss()) {
      router.dismissAll();
    }
  } catch {
    // Older / web runtimes may not support dismiss APIs.
  }
  router.replace(href);
}
