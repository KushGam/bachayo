import { NextRequest, NextResponse } from 'next/server';

import { customerBagAlmostGone } from '@/lib/notification-messages';
import { sendNotificationPayload } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
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

export async function POST(request: NextRequest) {
  try {
    verifyWebhookSecret(request);

    const payload = (await request.json()) as WebhookPayload;
    if (payload.type !== 'UPDATE' || payload.table !== 'rescue_bags') {
      return NextResponse.json({ skipped: true });
    }

    const record = payload.record;
    const quantityAvailable = Number(record.quantity_available);
    const quantityReserved = Number(record.quantity_reserved);

    // Only fire on the exact transition to "one left" — otherwise every
    // reservation update on a low-stock bag would re-broadcast.
    if (quantityReserved !== quantityAvailable - 1) {
      return NextResponse.json({ skipped: true, reason: 'not_last_bag' });
    }

    const previousReserved = Number(payload.old_record?.quantity_reserved ?? NaN);
    if (Number.isFinite(previousReserved) && previousReserved === quantityReserved) {
      return NextResponse.json({ skipped: true, reason: 'stock_unchanged' });
    }

    if (String(record.status ?? 'active') !== 'active') {
      return NextResponse.json({ skipped: true, reason: 'not_active' });
    }

    const supabase = createSupabaseAdmin();
    const bagId = String(record.id);
    const partnerId = String(record.partner_id);

    const { data: partner } = await supabase
      .from('partners')
      .select('name, city_id, area_id')
      .eq('id', partnerId)
      .single();

    if (!partner?.city_id || !partner.area_id) {
      return NextResponse.json({ skipped: true, reason: 'missing_location' });
    }

    const { data: customers } = await supabase
      .from('profiles')
      .select('id, notification_prefs')
      .eq('role', 'customer')
      .eq('city_id', partner.city_id)
      .eq('area_id', partner.area_id)
      .not('push_token', 'is', null)
      .limit(50);

    const notificationPayload = customerBagAlmostGone({
      bagId,
      partnerId,
      partnerName: partner.name ?? 'a nearby partner',
    });

    let sent = 0;
    const errors: string[] = [];

    for (const customer of customers ?? []) {
      const prefs = customer.notification_prefs as { new_bags?: boolean } | null;
      if (prefs?.new_bags === false) continue;

      try {
        const result = await sendNotificationPayload(customer.id, notificationPayload);
        if (result.success) sent += 1;
        else if (result.error) errors.push(`${customer.id}: ${result.error}`);
      } catch (err) {
        errors.push(`${customer.id}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }

    return NextResponse.json({ ok: true, bagId, sent, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status =
      message === 'Unauthorized webhook' || message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
