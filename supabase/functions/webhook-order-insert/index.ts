import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { sendToUser, verifyWebhook } from '../_shared/expo-push.ts';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function parsePickupSendAt(availableDate: string, pickupStart: string) {
  const time = pickupStart.slice(0, 5);
  const pickupIso = `${availableDate}T${time}:00+05:45`;
  const pickup = new Date(pickupIso);
  return new Date(pickup.getTime() - 30 * 60 * 1000).toISOString();
}

Deno.serve(async (req) => {
  try {
    verifyWebhook(req);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload = (await req.json()) as WebhookPayload;
    if (payload.type !== 'INSERT' || payload.table !== 'orders') {
      return jsonResponse({ skipped: true });
    }

    const order = payload.record;
    const orderId = String(order.id);
    const customerId = String(order.customer_id);
    const partnerId = String(order.partner_id);
    const bagId = String(order.bag_id);

    const [{ data: partner }, { data: customer }, { data: bag }] = await Promise.all([
      supabase.from('partners').select('user_id, name').eq('id', partnerId).single(),
      supabase.from('profiles').select('full_name').eq('id', customerId).single(),
      supabase
        .from('rescue_bags')
        .select('pickup_start, available_date, title')
        .eq('id', bagId)
        .single(),
    ]);

    const customerName = customer?.full_name ?? 'A customer';

    if (partner?.user_id) {
      await sendToUser(
        supabase,
        partner.user_id,
        'New reservation',
        `New reservation from ${customerName}`,
        { type: 'partner_dashboard' },
      );
    }

    if (bag?.available_date && bag?.pickup_start) {
      const sendAt = parsePickupSendAt(bag.available_date, bag.pickup_start);
      await supabase.from('scheduled_notifications').insert({
        user_id: customerId,
        title: 'Pickup opens soon',
        body: 'Your pickup window opens in 30 minutes',
        data: { type: 'order', orderId },
        send_at: sendAt,
      });
    }

    return jsonResponse({ ok: true, orderId });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});
