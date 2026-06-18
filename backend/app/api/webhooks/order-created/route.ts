import { NextRequest, NextResponse } from 'next/server';

import { callSendNotification } from '@/lib/notifications';
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

function formatPickupWindow(pickupStart: string, pickupEnd: string) {
  const start = pickupStart.slice(0, 5);
  const end = pickupEnd.slice(0, 5);
  return `${start}–${end}`;
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

    const supabase = createSupabaseAdmin();

    const [{ data: partner }, { data: bag }] = await Promise.all([
      supabase.from('partners').select('user_id, name').eq('id', partnerId).single(),
      supabase
        .from('rescue_bags')
        .select('title, pickup_start, pickup_end')
        .eq('id', bagId)
        .single(),
    ]);

    const bagTitle = bag?.title ?? 'rescue bag';
    const pickupWindow = bag
      ? formatPickupWindow(bag.pickup_start, bag.pickup_end)
      : 'your scheduled time';

    const results: {
      partner?: { success: boolean; error?: string };
      customer?: { success: boolean; error?: string };
    } = {};

    if (partner?.user_id) {
      results.partner = await callSendNotification(
        partner.user_id,
        'New reservation!',
        `Someone reserved your ${bagTitle} bag`,
      );
    }

    results.customer = await callSendNotification(
      customerId,
      'Booking confirmed!',
      `Pick up at ${pickupWindow} tonight`,
    );

    return NextResponse.json({ ok: true, orderId, notifications: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status =
      message === 'Unauthorized webhook' || message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
