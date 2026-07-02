import { NextRequest, NextResponse } from 'next/server';

import {
  customerNewBagNearby,
  customerReservationConfirmed,
  partnerBagSoldOut,
  partnerNewReservation,
} from '@/lib/notification-messages';
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

export async function POST(request: NextRequest) {
  try {
    verifyWebhookSecret(request);

    const payload = (await request.json()) as WebhookPayload;
    if (payload.type !== 'INSERT' || payload.table !== 'orders') {
      return NextResponse.json({ skipped: true });
    }

    const order = payload.record;
    const orderId = String(order.id);
    const customerId = String(order.customer_id);
    const partnerId = String(order.partner_id);
    const bagId = String(order.bag_id);
    const quantity = Number(order.quantity ?? 1);

    const supabase = createSupabaseAdmin();

    const [{ data: partner }, { data: bag }] = await Promise.all([
      supabase.from('partners').select('user_id, name').eq('id', partnerId).single(),
      supabase
        .from('rescue_bags')
        .select('title, pickup_start, pickup_end, quantity_available, quantity_reserved, status')
        .eq('id', bagId)
        .single(),
    ]);

    if (!bag) {
      return NextResponse.json({ ok: false, error: 'bag_not_found' }, { status: 404 });
    }

    const customerName = String(order.customer_name ?? 'A customer');
    const results: Record<string, { success?: boolean; error?: string }> = {};

    if (partner?.user_id) {
      const partnerPayload = partnerNewReservation({
        orderId,
        bagId,
        partnerId,
        customerName,
        quantity,
        bagTitle: bag.title,
        pickupStart: bag.pickup_start,
        pickupEnd: bag.pickup_end,
      });
      results.partner = await sendNotificationPayload(partner.user_id, partnerPayload);
    }

    const customerPayload = customerReservationConfirmed({
      orderId,
      bagId,
      partnerId,
      bagTitle: bag.title,
      partnerName: partner?.name ?? 'your partner',
      pickupStart: bag.pickup_start,
      pickupEnd: bag.pickup_end,
    });
    results.customer = await sendNotificationPayload(customerId, customerPayload);

    if (
      partner?.user_id &&
      bag.quantity_reserved >= bag.quantity_available &&
      bag.status === 'sold_out'
    ) {
      const soldOutPayload = partnerBagSoldOut({
        bagId,
        partnerId,
        bagTitle: bag.title,
      });
      results.partnerSoldOut = await sendNotificationPayload(partner.user_id, soldOutPayload);
    }

    return NextResponse.json({ ok: true, orderId, notifications: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status =
      message === 'Unauthorized webhook' || message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
