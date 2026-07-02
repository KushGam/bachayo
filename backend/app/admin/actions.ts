'use server';

import { revalidatePath } from 'next/cache';

import { TIER_PRICES_NPR } from '@/lib/admin/constants';
import { requireAdminSession } from '@/lib/admin-auth';
import { deliverNotification } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

async function admin() {
  await requireAdminSession();
  return createSupabaseAdmin();
}

export async function extendPartnerTrial(partnerId: string, days: number) {
  const supabase = await admin();
  const { data: partner } = await supabase
    .from('partners')
    .select('trial_ends_at')
    .eq('id', partnerId)
    .single();

  const base = partner?.trial_ends_at ? new Date(partner.trial_ends_at) : new Date();
  if (base.getTime() < Date.now()) base.setTime(Date.now());
  base.setDate(base.getDate() + days);

  await supabase
    .from('partners')
    .update({
      trial_ends_at: base.toISOString(),
      subscription_status: 'trial',
    })
    .eq('id', partnerId);

  revalidatePath('/admin/partners');
  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath('/admin/billing');
}

export async function changePartnerTier(partnerId: string, tier: 'small' | 'medium' | 'large') {
  const supabase = await admin();
  await supabase.from('partners').update({ subscription_tier: tier }).eq('id', partnerId);
  revalidatePath('/admin/partners');
  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath('/admin/billing');
}

export async function markPartnerPaid(partnerId: string) {
  const supabase = await admin();
  const { data: partner } = await supabase
    .from('partners')
    .select('subscription_tier')
    .eq('id', partnerId)
    .single();

  const tier = (partner?.subscription_tier ?? 'small') as keyof typeof TIER_PRICES_NPR;
  const amount = TIER_PRICES_NPR[tier] ?? 800;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase.from('subscription_payments').insert({
    partner_id: partnerId,
    tier,
    amount,
    status: 'paid',
    payment_method: 'manual',
    period_start: now.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
  });

  await supabase
    .from('partners')
    .update({
      subscription_status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('id', partnerId);

  revalidatePath('/admin/partners');
  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath('/admin/billing');
}

export async function suspendPartner(partnerId: string) {
  const supabase = await admin();
  await supabase
    .from('partners')
    .update({ is_active: false, subscription_status: 'paused' })
    .eq('id', partnerId);
  revalidatePath('/admin/partners');
  revalidatePath(`/admin/partners/${partnerId}`);
}

export async function reactivatePartner(partnerId: string) {
  const supabase = await admin();
  await supabase
    .from('partners')
    .update({ is_active: true, subscription_status: 'active' })
    .eq('id', partnerId);
  revalidatePath('/admin/partners');
  revalidatePath(`/admin/partners/${partnerId}`);
}

export async function deletePartner(partnerId: string) {
  const supabase = await admin();
  const { data: partner } = await supabase
    .from('partners')
    .select('user_id')
    .eq('id', partnerId)
    .single();

  await supabase.from('partners').delete().eq('id', partnerId);

  if (partner?.user_id) {
    await supabase.auth.admin.deleteUser(partner.user_id);
  }

  revalidatePath('/admin/partners');
}

export async function recordManualPayment(input: {
  partnerId: string;
  amount: number;
  paymentMethod: string;
  paymentRef?: string;
}) {
  const supabase = await admin();
  const { data: partner } = await supabase
    .from('partners')
    .select('subscription_tier')
    .eq('id', input.partnerId)
    .single();

  const tier = (partner?.subscription_tier ?? 'small') as 'small' | 'medium' | 'large';
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase.from('subscription_payments').insert({
    partner_id: input.partnerId,
    tier,
    amount: input.amount,
    status: 'paid',
    payment_method: input.paymentMethod,
    payment_ref: input.paymentRef ?? null,
    period_start: now.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
  });

  await supabase
    .from('partners')
    .update({
      subscription_status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('id', input.partnerId);

  revalidatePath('/admin/billing');
  revalidatePath('/admin/partners');
}

export async function convertTrialPartner(partnerId: string, extendDays?: number) {
  if (extendDays && extendDays > 0) {
    await extendPartnerTrial(partnerId, extendDays);
    return;
  }
  await markPartnerPaid(partnerId);
}

export async function suspendCustomer(profileId: string) {
  const supabase = await admin();
  await supabase.from('profiles').update({ is_suspended: true }).eq('id', profileId);
  revalidatePath('/admin/customers');
}

export async function deleteCustomer(profileId: string) {
  const supabase = await admin();
  await supabase.auth.admin.deleteUser(profileId);
  revalidatePath('/admin/customers');
}

export async function removeReview(reviewId: string) {
  const supabase = await admin();
  await supabase.from('reviews').delete().eq('id', reviewId);
  revalidatePath('/admin/reviews');
}

export async function sendAdminNotification(input: {
  targetType: string;
  targetLabel: string;
  title: string;
  body: string;
  cityId?: string;
  userId?: string;
}) {
  const supabase = await admin();

  let userIds: string[] = [];

  if (input.userId) {
    userIds = [input.userId];
  } else if (input.targetType === 'partners') {
    const { data } = await supabase.from('partners').select('user_id');
    userIds = (data ?? []).map((p) => p.user_id);
  } else if (input.targetType === 'customers') {
    const { data } = await supabase.from('profiles').select('id').eq('role', 'customer');
    userIds = (data ?? []).map((p) => p.id);
  } else if (input.targetType === 'city' && input.cityId) {
    const [{ data: partners }, { data: customers }] = await Promise.all([
      supabase.from('partners').select('user_id').eq('city_id', input.cityId),
      supabase.from('profiles').select('id').eq('city_id', input.cityId),
    ]);
    userIds = [
      ...(partners ?? []).map((p) => p.user_id),
      ...(customers ?? []).map((c) => c.id),
    ];
  } else {
    const [{ data: partners }, { data: profiles }] = await Promise.all([
      supabase.from('partners').select('user_id'),
      supabase.from('profiles').select('id'),
    ]);
    userIds = [
      ...(partners ?? []).map((p) => p.user_id),
      ...(profiles ?? []).map((p) => p.id),
    ];
  }

  const unique = [...new Set(userIds)];
  let sent = 0;

  for (let i = 0; i < unique.length; i += 10) {
    const batch = unique.slice(i, i + 10);
    const results = await Promise.all(
      batch.map((userId) =>
        deliverNotification(userId, input.title, input.body).catch(() => ({ success: false })),
      ),
    );
    sent += results.filter((r) => r.success).length;
    await new Promise((r) => setTimeout(r, 200));
  }

  await supabase.from('admin_notification_log').insert({
    target_type: input.targetType,
    target_label: input.targetLabel,
    title: input.title,
    body: input.body,
    recipients_count: sent,
  });

  revalidatePath('/admin/notifications');
  return { sent, total: unique.length };
}
