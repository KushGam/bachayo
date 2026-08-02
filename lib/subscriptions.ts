import {
  DEFAULT_TIER_PRICING,
  type SubscriptionStatus,
  type SubscriptionTier,
} from '@/constants/subscriptions';

import type { PartnerApprovalFields } from '@/lib/partnerApproval';
import { isPartnerApproved } from '@/lib/partnerApproval';

export type PartnerSubscriptionFields = PartnerApprovalFields & {
  subscription_tier?: SubscriptionTier | null;
  subscription_status?: SubscriptionStatus | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  avg_daily_meals?: number | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  payment_method_on_file?: boolean | null;
  payment_method_type?: string | null;
  payment_method_mask?: string | null;
  is_active?: boolean | null;
};

export type TierPricing = {
  tier: SubscriptionTier;
  monthly_price_npr: number;
  max_bags_per_day: number | null;
  max_bags_per_month: number | null;
  label: string;
};

export function getTierPricing(
  tier: SubscriptionTier,
  pricingRows?: TierPricing[] | null,
): TierPricing {
  const row = pricingRows?.find((item) => item.tier === tier);
  if (row) {
    return {
      ...row,
      max_bags_per_day:
        row.max_bags_per_day ?? DEFAULT_TIER_PRICING[tier].maxBagsPerDay,
    };
  }
  const fallback = DEFAULT_TIER_PRICING[tier];
  return {
    tier,
    monthly_price_npr: fallback.monthlyPriceNpr,
    max_bags_per_day: fallback.maxBagsPerDay,
    max_bags_per_month: fallback.maxBagsPerMonth,
    label: fallback.label,
  };
}

export function formatTierPrice(npr: number) {
  return `NPR ${npr.toLocaleString('en-NP')}/mo`;
}

export function getTrialDaysRemaining(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 0;
  const end = new Date(trialEndsAt).getTime();
  const diffMs = end - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/** Days until a period end date (negative if already past). */
export function getDaysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
}

export function getSubscriptionExpiryIso(partner: PartnerSubscriptionFields | null | undefined) {
  if (!partner) return null;
  const status = partner.subscription_status ?? 'trial';
  if (status === 'trial') return partner.trial_ends_at ?? null;
  return partner.current_period_end ?? null;
}

export function formatSubscriptionDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NP', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function isPartnerVisibleToCustomers(partner: PartnerSubscriptionFields | null | undefined) {
  if (!partner) return false;
  if (!isPartnerApproved(partner)) return false;
  if (partner.is_active === false) return false;
  const status = partner.subscription_status ?? 'trial';
  return status === 'trial' || status === 'active';
}

/** Mirrors DB trigger: only trial/active + is_active partners may create listings. */
export function isPartnerAllowedToListBags(partner: PartnerSubscriptionFields | null | undefined) {
  if (!partner) return false;
  if (partner.is_active === false) return false;
  const status = partner.subscription_status ?? 'trial';
  return status === 'trial' || status === 'active';
}

export function getStatusLabel(status: SubscriptionStatus) {
  switch (status) {
    case 'trial':
      return 'Trial';
    case 'active':
      return 'Active';
    case 'past_due':
      return 'Past due';
    case 'paused':
      return 'Paused';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function addOneMonth(from = new Date()) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}
