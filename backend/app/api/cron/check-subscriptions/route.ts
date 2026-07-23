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

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Manual billing cron:
 * - Remind partners whose subscription expires in ~7 days
 * - Mark expired active subscriptions as past_due and hide bags
 * - Keep trial-ending + review reminder jobs
 *
 * No automatic gateway charges — partners pay manually; admin marks paid.
 */
export async function GET(request: NextRequest) {
  try {
    verifyCronRequest(request);

    const supabase = createSupabaseAdmin();
    const now = new Date();
    const nowIso = now.toISOString();

    const summary = {
      expiringReminders: 0,
      expired: 0,
      trialPastDue: 0,
      reviewReminders: 0,
      trialWarnings: 0,
      errors: [] as string[],
    };

    // ---- Active subscriptions expiring within 7 days (but not yet expired) ----
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: expiringSoon } = await supabase
      .from('partners')
      .select('id, name, user_id, subscription_tier, current_period_end')
      .eq('subscription_status', 'active')
      .lte('current_period_end', sevenDaysFromNow.toISOString())
      .gte('current_period_end', nowIso);

    for (const partner of expiringSoon ?? []) {
      try {
        if (!partner.user_id || !partner.current_period_end) continue;
        const daysLeft = Math.max(
          0,
          Math.ceil(
            (new Date(partner.current_period_end).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );

        // Only ping once when roughly 7 days remain (same window as old trial warning)
        if (daysLeft < 6 || daysLeft > 7) continue;

        await callSendNotification(
          partner.user_id,
          `⚠️ Subscription expires in ${daysLeft} days`,
          `Renew your ${partner.subscription_tier} plan to keep your bags live on LastBag.`,
          {
            type: 'subscription',
            data: { partner_id: partner.id, type: 'subscription' },
          },
        );
        summary.expiringReminders += 1;
      } catch (err) {
        summary.errors.push(
          `expiring ${partner.id}: ${err instanceof Error ? err.message : 'failed'}`,
        );
      }
    }

    // ---- Expired active subscriptions → past_due + hide bags ----
    const { data: expired } = await supabase
      .from('partners')
      .select('id, name, user_id')
      .eq('subscription_status', 'active')
      .lt('current_period_end', nowIso);

    for (const partner of expired ?? []) {
      try {
        await supabase
          .from('partners')
          .update({
            subscription_status: 'past_due',
            is_active: false,
          })
          .eq('id', partner.id);

        await supabase
          .from('rescue_bags')
          .update({ status: 'expired' })
          .eq('partner_id', partner.id)
          .eq('status', 'active');

        if (partner.user_id) {
          await callSendNotification(
            partner.user_id,
            '🚫 Subscription expired',
            'Your LastBag listings are now hidden. Renew to go live again.',
            {
              type: 'subscription',
              data: { partner_id: partner.id, type: 'subscription' },
            },
          );
        }

        try {
          await fetch(`${getSiteUrl()}/api/support/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'lastbagnp@gmail.com',
              subject: `Partner subscription expired: ${partner.name}`,
              message: `${partner.name} subscription has expired. Follow up needed.`,
            }),
          });
        } catch {
          // Support endpoint may be unavailable — don't fail the cron.
        }

        summary.expired += 1;
      } catch (err) {
        summary.errors.push(
          `expired ${partner.id}: ${err instanceof Error ? err.message : 'failed'}`,
        );
      }
    }

    // ---- Trials that ended with no conversion → past_due ----
    const { data: expiredTrials } = await supabase
      .from('partners')
      .select('id, user_id')
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', nowIso);

    for (const partner of expiredTrials ?? []) {
      try {
        await supabase
          .from('partners')
          .update({ subscription_status: 'past_due', is_active: false })
          .eq('id', partner.id);

        await supabase
          .from('rescue_bags')
          .update({ status: 'expired' })
          .eq('partner_id', partner.id)
          .eq('status', 'active');

        if (partner.user_id) {
          await callSendNotification(
            partner.user_id,
            'Trial ended',
            'Your free trial ended — renew on the billing screen to keep your bags visible',
            {
              type: 'subscription',
              data: { partner_id: partner.id, type: 'subscription' },
            },
          );
        }
        summary.trialPastDue += 1;
      } catch (err) {
        summary.errors.push(
          `trial ${partner.id}: ${err instanceof Error ? err.message : 'failed'}`,
        );
      }
    }

    // ---- Review reminders (unchanged) ----
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

        const partner = order.partner as
          | { id?: string; name?: string }
          | { id?: string; name?: string }[]
          | null;
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

    // ---- Trial ending in 7 days ----
    const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const sixDaysAhead = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString();

    const { data: trialEndingSoon } = await supabase
      .from('partners')
      .select('id, user_id, trial_ends_at')
      .eq('subscription_status', 'trial')
      .gt('trial_ends_at', sixDaysAhead)
      .lte('trial_ends_at', sevenDaysAhead);

    for (const partner of trialEndingSoon ?? []) {
      try {
        const payload = partnerTrialEnding({ partnerId: partner.id, daysLeft: 7 });
        await sendNotificationPayload(partner.user_id, payload);
        summary.trialWarnings += 1;
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
