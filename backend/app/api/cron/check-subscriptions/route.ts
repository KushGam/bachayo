import { NextRequest, NextResponse } from 'next/server';

import { callSendNotification, sendNotificationPayload } from '@/lib/notifications';
import {
  customerReviewRequest,
  partnerTrialEnding,
} from '@/lib/notification-messages';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

function verifyCronRequest(request: NextRequest) {
  if (request.headers.get('x-vercel-cron') === '1') {
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get('authorization') === `Bearer ${cronSecret}`) {
    return;
  }

  throw new Error('Unauthorized cron');
}

type PartnerBillingRow = {
  id: string;
  user_id: string;
  subscription_tier: 'small' | 'medium' | 'large';
  subscription_status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  payment_method_on_file: boolean | null;
  payment_method_type: string | null;
  current_period_start: string | null;
};

type TierPriceRow = {
  tier: 'small' | 'medium' | 'large';
  monthly_price_npr: number;
};

async function getTierPrices(supabase: ReturnType<typeof createSupabaseAdmin>) {
  const { data } = await supabase.from('subscription_tier_pricing').select('tier, monthly_price_npr');
  const map = new Map<string, number>();
  for (const row of (data ?? []) as TierPriceRow[]) {
    map.set(row.tier, row.monthly_price_npr);
  }
  return map;
}

function addOneMonthIso(from = new Date()) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

async function chargePartner(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  partner: PartnerBillingRow,
  amountNpr: number,
) {
  const now = new Date();
  const periodEnd = addOneMonthIso(now);

  await supabase.from('subscription_payments').insert({
    partner_id: partner.id,
    tier: partner.subscription_tier,
    amount: amountNpr,
    status: 'paid',
    payment_method: partner.payment_method_type ?? 'saved',
    payment_ref: `auto_${partner.id}_${Date.now()}`,
    period_start: now.toISOString().slice(0, 10),
    period_end: periodEnd.slice(0, 10),
  });

  await supabase
    .from('partners')
    .update({
      subscription_status: 'active',
      is_active: true,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd,
    })
    .eq('id', partner.id);
}

export async function GET(request: NextRequest) {
  try {
    verifyCronRequest(request);

    const supabase = createSupabaseAdmin();
    const nowIso = new Date().toISOString();
    const prices = await getTierPrices(supabase);

    const summary = {
      trialConverted: 0,
      trialPastDue: 0,
      renewed: 0,
      renewalFailed: 0,
      paused: 0,
      reviewReminders: 0,
      errors: [] as string[],
    };

    const { data: expiredTrials } = await supabase
      .from('partners')
      .select(
        'id, user_id, subscription_tier, subscription_status, trial_ends_at, payment_method_on_file, payment_method_type, current_period_start, current_period_end',
      )
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', nowIso);

    for (const partner of (expiredTrials ?? []) as PartnerBillingRow[]) {
      try {
        const amount = prices.get(partner.subscription_tier) ?? 800;
        if (partner.payment_method_on_file) {
          await chargePartner(supabase, partner, amount);
          summary.trialConverted += 1;
        } else {
          await supabase
            .from('partners')
            .update({ subscription_status: 'past_due' })
            .eq('id', partner.id);

          await callSendNotification(
            partner.user_id,
            'Trial ended',
            'Your trial ended — add a payment method to keep your bags visible',
            {
              type: 'subscription',
              data: { partner_id: partner.id, type: 'subscription' },
            },
          );
          summary.trialPastDue += 1;
        }
      } catch (err) {
        summary.errors.push(
          `trial ${partner.id}: ${err instanceof Error ? err.message : 'failed'}`,
        );
      }
    }

    const { data: dueRenewals } = await supabase
      .from('partners')
      .select(
        'id, user_id, subscription_tier, subscription_status, payment_method_on_file, payment_method_type, current_period_start, current_period_end',
      )
      .eq('subscription_status', 'active')
      .lt('current_period_end', nowIso);

    for (const partner of (dueRenewals ?? []) as PartnerBillingRow[]) {
      try {
        const amount = prices.get(partner.subscription_tier) ?? 800;
        if (partner.payment_method_on_file) {
          await chargePartner(supabase, partner, amount);
          summary.renewed += 1;
        } else {
          await supabase
            .from('partners')
            .update({ subscription_status: 'past_due' })
            .eq('id', partner.id);
          await callSendNotification(
            partner.user_id,
            'Subscription payment failed',
            'Add a payment method to keep your rescue bags live',
            {
              type: 'subscription',
              data: { partner_id: partner.id, type: 'subscription' },
            },
          );
          summary.renewalFailed += 1;
        }
      } catch (err) {
        summary.errors.push(
          `renewal ${partner.id}: ${err instanceof Error ? err.message : 'failed'}`,
        );
      }
    }

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stalePastDue } = await supabase
      .from('partners')
      .select('id, user_id, trial_ends_at, current_period_end')
      .eq('subscription_status', 'past_due');

    for (const partner of stalePastDue ?? []) {
      const lapsedAt = partner.current_period_end ?? partner.trial_ends_at;
      if (!lapsedAt || lapsedAt > fiveDaysAgo) continue;

      try {
        await supabase
          .from('partners')
          .update({ subscription_status: 'paused', is_active: false })
          .eq('id', partner.id);

        await callSendNotification(
          partner.user_id,
          'Account paused',
          'Your subscription lapsed — reactivate to show bags to customers again',
          {
            type: 'subscription',
            data: { partner_id: partner.id, type: 'subscription' },
          },
        );
        summary.paused += 1;
      } catch (err) {
        summary.errors.push(
          `pause ${partner.id}: ${err instanceof Error ? err.message : 'failed'}`,
        );
      }
    }

    const reviewWindowStart = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const reviewWindowEnd = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

    const { data: reviewableOrders } = await supabase
      .from('orders')
      .select('id, customer_id, partner:partners(id, name)')
      .eq('status', 'picked_up')
      .gte('picked_up_at', reviewWindowStart)
      .lte('picked_up_at', reviewWindowEnd);

    for (const order of reviewableOrders ?? []) {
      try {
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('order_id', order.id)
          .maybeSingle();

        if (existingReview) continue;

        const partner = order.partner as { id?: string; name?: string } | { id?: string; name?: string }[] | null;
        const partnerName = Array.isArray(partner)
          ? partner[0]?.name ?? 'your partner'
          : partner?.name ?? 'your partner';
        const partnerId = Array.isArray(partner) ? partner[0]?.id : partner?.id;

        const reviewPayload = customerReviewRequest({
          orderId: order.id,
          partnerId: partnerId ?? '',
          partnerName,
        });
        await sendNotificationPayload(order.customer_id, reviewPayload);
        summary.reviewReminders += 1;
      } catch (err) {
        summary.errors.push(
          `review ${order.id}: ${err instanceof Error ? err.message : 'failed'}`,
        );
      }
    }

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const sixDaysFromNow = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString();

    const { data: trialEndingSoon } = await supabase
      .from('partners')
      .select('id, user_id, trial_ends_at')
      .eq('subscription_status', 'trial')
      .gt('trial_ends_at', sixDaysFromNow)
      .lte('trial_ends_at', sevenDaysFromNow);

    for (const partner of trialEndingSoon ?? []) {
      try {
        const payload = partnerTrialEnding({ partnerId: partner.id, daysLeft: 7 });
        await sendNotificationPayload(partner.user_id, payload);
      } catch (err) {
        summary.errors.push(
          `trial_warning ${partner.id}: ${err instanceof Error ? err.message : 'failed'}`,
        );
      }
    }

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = message === 'Unauthorized cron' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
