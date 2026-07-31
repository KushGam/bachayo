import { NextRequest, NextResponse } from 'next/server';

import { verifyCronRequest } from '@/lib/cron-auth';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Flip reservations to `missed` once their pickup window has closed, so stock
 * is released and dashboards stop showing stale active orders.
 *
 * All the logic lives in the SQL function from migration 038 — this route only
 * gives Vercel Cron something to call.
 */
export async function GET(request: NextRequest) {
  try {
    verifyCronRequest(request);

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.rpc('mark_missed_orders_after_pickup');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, marked: data ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = message === 'Unauthorized cron' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
