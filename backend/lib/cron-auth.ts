import type { NextRequest } from 'next/server';

/**
 * Vercel sets x-vercel-cron on its own scheduled invocations. CRON_SECRET is the
 * escape hatch for manual runs and for anything triggering these routes from
 * outside Vercel.
 */
export function verifyCronRequest(request: NextRequest) {
  if (request.headers.get('x-vercel-cron') === '1') {
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get('authorization') === `Bearer ${cronSecret}`) {
    return;
  }

  throw new Error('Unauthorized cron');
}

/**
 * Nepal runs on UTC+05:45, so date arithmetic has to go through the timezone
 * rather than the server's clock — bag pickup times are stored as local dates
 * and wall-clock times.
 */
export function getNepalNow() {
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

export function timeToMinutes(time: string) {
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
