import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { CATEGORY_LABELS } from '@/lib/admin/constants';
import { cityLabel } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const valid = token ? await verifyAdminSession(token).catch(() => false) : false;
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const params = request.nextUrl.searchParams;

  let query = supabase.from('partners').select('*').order('created_at', { ascending: false });

  const city = params.get('city');
  const category = params.get('category');
  const status = params.get('status');
  const tier = params.get('tier');
  const q = params.get('q');

  if (city) query = query.eq('city_id', city);
  if (category) query = query.eq('category', category);
  if (status) query = query.eq('subscription_status', status);
  if (tier) query = query.eq('subscription_tier', tier);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = ['Name', 'Category', 'City', 'Phone', 'Tier', 'Status', 'Created'];
  const rows = (data ?? []).map((p) => [
    p.name,
    CATEGORY_LABELS[p.category] ?? p.category,
    cityLabel(p.city_id),
    p.phone ?? '',
    p.subscription_tier ?? '',
    p.subscription_status ?? '',
    p.created_at,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="partners.csv"',
    },
  });
}
