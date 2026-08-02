import { NextRequest, NextResponse } from 'next/server';

import { getNepalNow, timeToMinutes, verifyCronRequest } from '@/lib/cron-auth';
import { partnerBagExpiring } from '@/lib/notification-messages';
import { sendNotificationPayload } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Partner "bag expiring soon" alerts — 1 hour before pickup_end for today's
 * active bags with remaining stock.
 *
 * Subscription 7-day / expired alerts live in `/api/cron/check-subscriptions`,
 * not here. This route must run hourly (see vercel.json) so each bag lands in
 * the 0–60 minute window exactly once.
 */
export async function GET(request: NextRequest) {
  try {
    verifyCronRequest(request);

    const supabase = createSupabaseAdmin();
    const { today, nowMinutes } = getNepalNow();

    const { data: bags, error } = await supabase
      .from('rescue_bags')
      .select('id, partner_id, title, pickup_end, quantity_available, quantity_reserved')
      .eq('status', 'active')
      .eq('available_date', today);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let notified = 0;
    const errors: string[] = [];

    for (const bag of bags ?? []) {
      const remaining = bag.quantity_available - bag.quantity_reserved;
      if (remaining <= 0) continue;

      const endMinutes = timeToMinutes(bag.pickup_end);
      const diff = endMinutes - nowMinutes;
      // Half-open window so the hourly cron matches each bag exactly once.
      if (diff <= 0 || diff > 60) continue;

      const { data: partner } = await supabase
        .from('partners')
        .select('user_id')
        .eq('id', bag.partner_id)
        .single();

      if (!partner?.user_id) continue;

      try {
        const payload = partnerBagExpiring({
          bagId: bag.id,
          partnerId: bag.partner_id,
          bagTitle: bag.title,
          remaining,
          pickupEnd: bag.pickup_end,
        });
        const result = await sendNotificationPayload(partner.user_id, payload);
        if (result.success) {
          notified += 1;
        } else if (result.error) {
          errors.push(`${bag.id}: ${result.error}`);
        }
      } catch (err) {
        errors.push(
          `${bag.id}: ${err instanceof Error ? err.message : 'notification failed'}`,
        );
      }
    }

    return NextResponse.json({ success: true, notified, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = message === 'Unauthorized cron' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
