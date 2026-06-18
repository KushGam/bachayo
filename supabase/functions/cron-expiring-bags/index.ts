import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { sendToUser } from '../_shared/expo-push.ts';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function getNepalNow() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '0';

  return {
    today: `${get('year')}-${get('month')}-${get('day')}`,
    nowMinutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

Deno.serve(async (req) => {
  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret) {
      const provided = req.headers.get('x-cron-secret');
      if (provided !== cronSecret) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { today, nowMinutes } = getNepalNow();

    const { data: bags } = await supabase
      .from('rescue_bags')
      .select('id, partner_id, pickup_end, quantity_available, quantity_reserved, available_date, status')
      .eq('status', 'active')
      .eq('available_date', today);

    let notified = 0;

    for (const bag of bags ?? []) {
      const remaining = bag.quantity_available - bag.quantity_reserved;
      if (remaining <= 0) continue;

      const endMinutes = timeToMinutes(bag.pickup_end);
      const diff = endMinutes - nowMinutes;
      if (diff < 0 || diff > 60) continue;

      const { data: partner } = await supabase
        .from('partners')
        .select('user_id, name')
        .eq('id', bag.partner_id)
        .single();

      if (!partner?.user_id) continue;

      await sendToUser(
        supabase,
        partner.user_id,
        'Bags expiring soon',
        `Your bags expire in 1 hour — ${remaining} still available`,
        { type: 'partner_dashboard' },
      );
      notified += 1;
    }

    return jsonResponse({ ok: true, notified });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});
