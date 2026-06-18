import { NextRequest, NextResponse } from 'next/server';

import { callSendNotification } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

function verifyCronRequest(request: NextRequest) {
  if (request.headers.get('x-vercel-cron') === '1') {
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth === `Bearer ${cronSecret}`) {
      return;
    }
  }

  throw new Error('Unauthorized cron');
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

export async function GET(request: NextRequest) {
  try {
    verifyCronRequest(request);

    const supabase = createSupabaseAdmin();
    const { today, nowMinutes } = getNepalNow();

    const { data: bags, error } = await supabase
      .from('rescue_bags')
      .select('id, partner_id, pickup_end, quantity_available, quantity_reserved')
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
      if (diff < 0 || diff > 60) continue;

      const { data: partner } = await supabase
        .from('partners')
        .select('user_id')
        .eq('id', bag.partner_id)
        .single();

      if (!partner?.user_id) continue;

      try {
        const result = await callSendNotification(
          partner.user_id,
          'Bags expiring soon',
          `Your bag expires in 1 hour — ${remaining} still available`,
        );
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
