import { unstable_cache } from 'next/cache';

import { cityLabel, todayIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

type AdminClient = ReturnType<typeof createSupabaseAdmin>;

export type AdminCityOption = {
  id: string;
  name: string;
};

export type CityCoverageRow = {
  id: string;
  name: string;
  partners: number;
  customers: number;
  bagsToday: number;
  ordersToday: number;
};

/**
 * Distinct cities from live partner + customer data.
 */
export async function fetchActiveCityOptions(
  supabase: AdminClient,
): Promise<AdminCityOption[]> {
  const [{ data: partners }, { data: customers }] = await Promise.all([
    supabase.from('partners').select('city_id'),
    supabase.from('profiles').select('city_id').eq('role', 'customer'),
  ]);

  const ids = new Set<string>();
  for (const row of partners ?? []) {
    if (row.city_id) ids.add(row.city_id);
  }
  for (const row of customers ?? []) {
    if (row.city_id) ids.add(row.city_id);
  }

  return [...ids]
    .map((id) => ({ id, name: cityLabel(id) }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

/**
 * City coverage without N+1: 4 queries total, aggregate in memory.
 */
export async function fetchCityCoverage(supabase: AdminClient): Promise<CityCoverageRow[]> {
  const today = todayIso();
  const todayStart = `${today}T00:00:00`;

  const [{ data: partnerRows }, { data: customerRows }, { data: bagRows }, { data: orderRows }] =
    await Promise.all([
      supabase.from('partners').select('id, city_id'),
      supabase.from('profiles').select('city_id').eq('role', 'customer'),
      supabase.from('rescue_bags').select('partner_id').eq('available_date', today),
      supabase.from('orders').select('partner_id').gte('created_at', todayStart),
    ]);

  const partnerCity = new Map<string, string>();
  const partnersByCity = new Map<string, number>();
  for (const row of partnerRows ?? []) {
    const cityId = row.city_id?.trim() || 'unassigned';
    partnerCity.set(row.id, cityId);
    partnersByCity.set(cityId, (partnersByCity.get(cityId) ?? 0) + 1);
  }

  const customersByCity = new Map<string, number>();
  for (const row of customerRows ?? []) {
    const cityId = row.city_id?.trim() || 'unassigned';
    customersByCity.set(cityId, (customersByCity.get(cityId) ?? 0) + 1);
  }

  const bagsByCity = new Map<string, number>();
  for (const row of bagRows ?? []) {
    const cityId = partnerCity.get(row.partner_id) || 'unassigned';
    bagsByCity.set(cityId, (bagsByCity.get(cityId) ?? 0) + 1);
  }

  const ordersByCity = new Map<string, number>();
  for (const row of orderRows ?? []) {
    if (!row.partner_id) continue;
    const cityId = partnerCity.get(row.partner_id) || 'unassigned';
    ordersByCity.set(cityId, (ordersByCity.get(cityId) ?? 0) + 1);
  }

  const cityIds = new Set<string>([
    ...partnersByCity.keys(),
    ...customersByCity.keys(),
    ...bagsByCity.keys(),
    ...ordersByCity.keys(),
  ]);

  return [...cityIds]
    .map((id) => ({
      id,
      name: id === 'unassigned' || id === 'unknown' ? 'Unassigned' : cityLabel(id),
      partners: partnersByCity.get(id) ?? 0,
      customers: customersByCity.get(id) ?? 0,
      bagsToday: bagsByCity.get(id) ?? 0,
      ordersToday: ordersByCity.get(id) ?? 0,
    }))
    .filter((row) => row.partners > 0 || row.customers > 0 || row.bagsToday > 0 || row.ordersToday > 0)
    .sort((a, b) => {
      const score = (r: CityCoverageRow) =>
        r.partners * 10 + r.customers + r.bagsToday + r.ordersToday;
      return score(b) - score(a) || a.name.localeCompare(b.name);
    });
}

export const getCachedNewSupportCount = unstable_cache(
  async () => {
    const supabase = createSupabaseAdmin();
    const { count } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');
    return count ?? 0;
  },
  ['admin-new-support-count'],
  { revalidate: 30, tags: ['admin-support'] },
);
