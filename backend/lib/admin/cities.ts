import { cityLabel } from '@/lib/admin/format';
import type { createSupabaseAdmin } from '@/lib/supabase-admin';

type AdminClient = ReturnType<typeof createSupabaseAdmin>;

export type AdminCityOption = {
  id: string;
  name: string;
};

/**
 * Distinct cities from live partner + customer data — not a fixed country list.
 * Works for any city_id worldwide.
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
