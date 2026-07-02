import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const valid = token ? await verifyAdminSession(token).catch(() => false) : false;
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const params = request.nextUrl.searchParams;

  let query = supabase
    .from('subscription_payments')
    .select('*, partner:partners(name)')
    .order('created_at', { ascending: false });

  const status = params.get('status');
  const month = params.get('month');
  if (status) query = query.eq('status', status);
  if (month) query = query.gte('period_start', `${month}-01`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = ['Date', 'Partner', 'Tier', 'Amount', 'Method', 'Status'];
  const rows = (data ?? []).map((p) => {
    const partner = Array.isArray(p.partner) ? p.partner[0] : p.partner;
    return [p.created_at, partner?.name ?? '', p.tier, p.amount, p.payment_method ?? '', p.status];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="payments.csv"',
    },
  });
}
