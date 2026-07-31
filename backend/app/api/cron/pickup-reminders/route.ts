import { NextRequest, NextResponse } from 'next/server';

import { getNepalNow, timeToMinutes, verifyCronRequest } from '@/lib/cron-auth';
import { customerPickupReminder } from '@/lib/notification-messages';
import { sendNotificationPayload } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Nudge customers shortly before their pickup window opens.
 *
 * Scheduled every 15 minutes in vercel.json, so the match window is 15 minutes
 * wide — each order lands in exactly one run. The dedupe pass below covers
 * retries and schedule drift.
 */
const LEAD_MINUTES = 30;
const WINDOW_MINUTES = 15;

type BagJoin = {
  title: string | null;
  pickup_start: string | null;
  available_date: string | null;
  partner: { id: string; name: string | null } | { id: string; name: string | null }[] | null;
};

function firstOf<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function GET(request: NextRequest) {
  try {
    verifyCronRequest(request);

    const supabase = createSupabaseAdmin();
    const { today, nowMinutes } = getNepalNow();

    const { data: orders, error } = await supabase
      .from('orders')
      .select(
        'id, customer_id, bag:rescue_bags!inner(title, pickup_start, available_date, partner:partners(id, name))',
      )
      .in('status', ['pending', 'confirmed'])
      .eq('rescue_bags.available_date', today);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const due = (orders ?? []).filter((order) => {
      const bag = firstOf(order.bag as unknown as BagJoin | BagJoin[]);
      if (!bag?.pickup_start) return false;
      const minutesUntilPickup = timeToMinutes(bag.pickup_start) - nowMinutes;
      return (
        minutesUntilPickup <= LEAD_MINUTES &&
        minutesUntilPickup > LEAD_MINUTES - WINDOW_MINUTES
      );
    });

    if (due.length === 0) {
      return NextResponse.json({ success: true, sent: 0, skipped: 0, errors: [] });
    }

    // Don't re-notify an order a retry already handled.
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('notifications')
      .select('data')
      .eq('type', 'pickup_reminder')
      .gte('created_at', twoHoursAgo);

    const alreadySent = new Set(
      (recent ?? [])
        .map((row) => (row.data as { order_id?: string } | null)?.order_id)
        .filter((id): id is string => Boolean(id)),
    );

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const order of due) {
      if (alreadySent.has(order.id)) {
        skipped += 1;
        continue;
      }

      const bag = firstOf(order.bag as unknown as BagJoin | BagJoin[]);
      const partner = firstOf(bag?.partner ?? null);

      try {
        const payload = customerPickupReminder({
          orderId: order.id,
          partnerId: partner?.id ?? '',
          partnerName: partner?.name ?? 'the restaurant',
        });
        const result = await sendNotificationPayload(order.customer_id, payload);
        if (result.success) sent += 1;
        else if (result.error) errors.push(`${order.id}: ${result.error}`);
      } catch (err) {
        errors.push(`${order.id}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }

    return NextResponse.json({ success: true, sent, skipped, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = message === 'Unauthorized cron' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
