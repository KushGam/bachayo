import { NextRequest, NextResponse } from 'next/server';

import { isCustomerNearPartner } from '@/lib/geo';
import { customerNewBagNearby } from '@/lib/notification-messages';
import { sendNotificationPayload } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
};

function verifyWebhookSecret(request: NextRequest) {
  const expected = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!expected) {
    throw new Error('SUPABASE_WEBHOOK_SECRET is not configured');
  }

  const provided = request.headers.get('x-supabase-webhook-secret');
  if (provided !== expected) {
    throw new Error('Unauthorized webhook');
  }
}

function allowsNewBagAlerts(prefs: unknown) {
  if (!prefs || typeof prefs !== 'object') return true;
  return (prefs as { new_bags?: boolean }).new_bags !== false;
}

export async function POST(request: NextRequest) {
  try {
    verifyWebhookSecret(request);

    const payload = (await request.json()) as WebhookPayload;
    if (payload.type !== 'INSERT' || payload.table !== 'rescue_bags') {
      return NextResponse.json({ skipped: true });
    }

    const bag = payload.record;
    const bagId = String(bag.id);
    const partnerId = String(bag.partner_id);
    const status = String(bag.status ?? 'active');

    if (status !== 'active') {
      return NextResponse.json({ skipped: true, reason: 'not_active' });
    }

    const supabase = createSupabaseAdmin();

    const { data: partner } = await supabase
      .from('partners')
      .select('name, city_id, area_id, latitude, longitude')
      .eq('id', partnerId)
      .single();

    if (!partner?.city_id) {
      return NextResponse.json({ skipped: true, reason: 'missing_location' });
    }

    // Same city first, then distance (or area fallback) below.
    const { data: customers } = await supabase
      .from('profiles')
      .select(
        'id, push_token, notification_prefs, area_id, last_latitude, last_longitude, home_latitude, home_longitude',
      )
      .eq('role', 'customer')
      .eq('city_id', partner.city_id)
      .not('push_token', 'is', null)
      .limit(200);

    const priceNpr = Math.round(Number(bag.rescue_price ?? 0) / 100);
    const payloadTemplate = customerNewBagNearby({
      bagId,
      partnerId,
      partnerName: partner.name,
      priceNpr,
      pickupStart: String(bag.pickup_start),
      pickupEnd: String(bag.pickup_end),
    });

    let sent = 0;
    let skippedDistance = 0;
    const errors: string[] = [];

    for (const customer of customers ?? []) {
      if (!allowsNewBagAlerts(customer.notification_prefs)) continue;

      const nearby = isCustomerNearPartner({
        partner: {
          latitude: partner.latitude,
          longitude: partner.longitude,
          area_id: partner.area_id,
        },
        customer,
      });
      if (!nearby) {
        skippedDistance += 1;
        continue;
      }

      try {
        const result = await sendNotificationPayload(customer.id, payloadTemplate);
        if (result.success) sent += 1;
        else if (result.error) errors.push(`${customer.id}: ${result.error}`);
      } catch (err) {
        errors.push(`${customer.id}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }

    return NextResponse.json({ ok: true, bagId, sent, skippedDistance, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status =
      message === 'Unauthorized webhook' || message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
