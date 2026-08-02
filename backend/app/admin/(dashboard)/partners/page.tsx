import { Suspense } from 'react';

import { PageHeader } from '@/components/admin/StatCard';
import { PartnerStatusTabs } from '@/components/admin/PartnerStatusTabs';
import { Pagination, PartnersFilters, PartnersTable, type PartnerRow } from '@/components/admin/PartnersTable';
import { fetchActiveCityOptions } from '@/lib/admin/cities';
import { CATEGORY_LABELS } from '@/lib/admin/constants';
import { todayIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 60;

const PAGE_SIZE = 25;

async function loadPartners(searchParams: Record<string, string | undefined>) {
  const supabase = createSupabaseAdmin();
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const today = todayIso();

  const partnerColumns =
    'id, name, category, city_id, area_id, phone, created_at, subscription_tier, subscription_status, trial_ends_at, approval_status, user_id, latitude, longitude, location_verified';

  let query = supabase
    .from('partners')
    .select(partnerColumns, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (searchParams.city) query = query.eq('city_id', searchParams.city);
  if (searchParams.category) query = query.eq('category', searchParams.category);
  if (searchParams.status) query = query.eq('subscription_status', searchParams.status);
  if (searchParams.tier) query = query.eq('subscription_tier', searchParams.tier);
  if (searchParams.approval) query = query.eq('approval_status', searchParams.approval);
  if (searchParams.q) {
    query = query.or(`name.ilike.%${searchParams.q}%,phone.ilike.%${searchParams.q}%`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const partnerIds = (data ?? []).map((p) => p.id);
  const userIds = [...new Set((data ?? []).map((p) => p.user_id))];

  // Cap last-bag history: one recent row per partner is enough for the table.
  const [{ data: profiles }, { data: bagsToday }, { data: lastBags }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name, phone').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; phone: string | null }[] }),
    partnerIds.length
      ? supabase
          .from('rescue_bags')
          .select('partner_id')
          .eq('available_date', today)
          .in('partner_id', partnerIds)
      : Promise.resolve({ data: [] as { partner_id: string }[] }),
    partnerIds.length
      ? supabase
          .from('rescue_bags')
          .select('partner_id, created_at')
          .in('partner_id', partnerIds)
          .order('created_at', { ascending: false })
          .limit(Math.max(partnerIds.length * 3, 50))
      : Promise.resolve({ data: [] as { partner_id: string; created_at: string }[] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const bagsTodayCount = new Map<string, number>();
  for (const bag of bagsToday ?? []) {
    bagsTodayCount.set(bag.partner_id, (bagsTodayCount.get(bag.partner_id) ?? 0) + 1);
  }

  const lastBagMap = new Map<string, string>();
  for (const bag of lastBags ?? []) {
    if (!lastBagMap.has(bag.partner_id)) lastBagMap.set(bag.partner_id, bag.created_at);
  }

  const rows: PartnerRow[] = (data ?? []).map((p) => {
    const profile = profileMap.get(p.user_id);
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      categoryLabel: CATEGORY_LABELS[p.category] ?? p.category,
      city_id: p.city_id,
      area_id: p.area_id,
      phone: p.phone,
      created_at: p.created_at,
      subscription_tier: p.subscription_tier,
      subscription_status: p.subscription_status,
      trial_ends_at: p.trial_ends_at,
      approval_status: (p as { approval_status?: string }).approval_status ?? 'approved',
      owner_name: profile?.full_name ?? null,
      owner_phone: profile?.phone ?? null,
      bags_today: bagsTodayCount.get(p.id) ?? 0,
      last_bag_at: lastBagMap.get(p.id) ?? null,
      latitude: (p as { latitude?: number | null }).latitude ?? null,
      longitude: (p as { longitude?: number | null }).longitude ?? null,
      location_verified: Boolean((p as { location_verified?: boolean | null }).location_verified),
    };
  });

  return { rows, page, totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)) };
}

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = createSupabaseAdmin();

  const [
    { count: pendingCount },
    { count: suspendedCount },
    { rows, page, totalPages },
    cities,
  ] = await Promise.all([
    supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
    supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'suspended'),
    loadPartners(params),
    fetchActiveCityOptions(supabase),
  ]);

  return (
    <>
      <PageHeader title="Partners" subtitle="Manage restaurant owners and subscriptions" />
      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-[#E8E4DE]" />}>
        <PartnerStatusTabs pendingCount={pendingCount ?? 0} suspendedCount={suspendedCount ?? 0} />
      </Suspense>
      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-[#E8E4DE]" />}>
        <PartnersFilters cities={cities} />
      </Suspense>
      <PartnersTable partners={rows} />
      <Pagination page={page} totalPages={totalPages} />
    </>
  );
}
