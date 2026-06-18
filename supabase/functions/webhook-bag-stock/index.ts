import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { sendToCustomers, verifyWebhook } from '../_shared/expo-push.ts';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  try {
    verifyWebhook(req);

    const payload = (await req.json()) as WebhookPayload;
    if (payload.type !== 'UPDATE' || payload.table !== 'rescue_bags') {
      return jsonResponse({ skipped: true });
    }

    const record = payload.record;
    const quantityAvailable = Number(record.quantity_available);
    const quantityReserved = Number(record.quantity_reserved);

    if (quantityReserved !== quantityAvailable - 1) {
      return jsonResponse({ skipped: true, reason: 'not_last_bag' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const partnerId = String(record.partner_id);
    const { data: partner } = await supabase
      .from('partners')
      .select('name')
      .eq('id', partnerId)
      .single();

    const partnerName = partner?.name ?? 'a nearby partner';

    await sendToCustomers(supabase, 'Almost gone!', `Only 1 bag left at ${partnerName}!`, {
      type: 'bag',
      bagId: String(record.id),
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});
