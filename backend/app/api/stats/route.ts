import { NextResponse } from 'next/server';

import { createSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    const [partnersRes, ordersRes] = await Promise.all([
      supabase.from('partners').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'picked_up'),
    ]);

    const partners = partnersRes.count ?? 0;
    const orders = ordersRes.count ?? 0;
    const foodRescued = Number((orders * 0.5).toFixed(1));

    return NextResponse.json({
      partners,
      orders,
      foodRescued,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

