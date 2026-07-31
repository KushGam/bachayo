import type { SubscriptionTier } from '@/constants/subscriptions';
import { addOneMonth, getTierPricing } from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';

/** Payment gateways are disabled for v1 (cash on pickup), so this stays local. */
export type SubscriptionPaymentMethod = 'esewa' | 'khalti' | 'cash';

export async function fetchTierPricing() {
  const { data, error } = await supabase.from('subscription_tier_pricing').select('*');
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function fetchSubscriptionPayments(partnerId: string) {
  return supabase
    .from('subscription_payments')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
}

export async function countBagsListedThisMonth(partnerId: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString().slice(0, 10);

  const { count, error } = await supabase
    .from('rescue_bags')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .gte('available_date', startIso);

  return { count: count ?? 0, error };
}

export async function activatePartnerSubscription({
  partnerId,
  tier,
  paymentMethod,
  paymentMask,
  paymentRef,
  amountNpr,
}: {
  partnerId: string;
  tier: SubscriptionTier;
  paymentMethod: SubscriptionPaymentMethod;
  paymentMask: string;
  paymentRef: string;
  amountNpr: number;
}) {
  const now = new Date();
  const periodEnd = addOneMonth(now);

  const { error: partnerError } = await supabase
    .from('partners')
    .update({
      subscription_tier: tier,
      subscription_status: 'active',
      is_active: true,
      payment_method_on_file: true,
      payment_method_type: paymentMethod,
      payment_method_mask: paymentMask,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('id', partnerId);

  if (partnerError) return { error: partnerError };

  const { error: paymentError } = await supabase.from('subscription_payments').insert({
    partner_id: partnerId,
    tier,
    amount: amountNpr,
    status: 'paid',
    payment_method: paymentMethod,
    payment_ref: paymentRef,
    period_start: now.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
  });

  return { error: paymentError };
}

export async function pausePartnerSubscription(partnerId: string) {
  return supabase
    .from('partners')
    .update({
      subscription_status: 'paused',
      is_active: false,
    })
    .eq('id', partnerId);
}

export async function updatePartnerTier(partnerId: string, tier: SubscriptionTier, avgDailyMeals: number) {
  return supabase
    .from('partners')
    .update({
      subscription_tier: tier,
      avg_daily_meals: avgDailyMeals,
    })
    .eq('id', partnerId);
}

export function getSubscriptionAmountNpr(tier: SubscriptionTier, pricingRows?: Parameters<typeof getTierPricing>[1]) {
  return getTierPricing(tier, pricingRows).monthly_price_npr;
}
