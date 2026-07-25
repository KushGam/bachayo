import { PageHeader } from '@/components/admin/StatCard';
import { cityLabel, todayIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

type CityStats = {
  id: string;
  name: string;
  partners: number;
  customers: number;
  bagsToday: number;
  ordersToday: number;
};

export default async function AdminCitiesPage() {
  const supabase = createSupabaseAdmin();
  const today = todayIso();

  const [{ data: partnerRows }, { data: customerRows }] = await Promise.all([
    supabase.from('partners').select('id, city_id'),
    supabase.from('profiles').select('id, city_id').eq('role', 'customer'),
  ]);

  const partnerIdsByCity = new Map<string, string[]>();
  for (const row of partnerRows ?? []) {
    const cityId = row.city_id?.trim() || 'unassigned';
    const list = partnerIdsByCity.get(cityId) ?? [];
    list.push(row.id);
    partnerIdsByCity.set(cityId, list);
  }

  const customersByCity = new Map<string, number>();
  for (const row of customerRows ?? []) {
    const cityId = row.city_id?.trim() || 'unassigned';
    customersByCity.set(cityId, (customersByCity.get(cityId) ?? 0) + 1);
  }

  const cityIds = new Set<string>([...partnerIdsByCity.keys(), ...customersByCity.keys()]);

  const rows: CityStats[] = (
    await Promise.all(
      [...cityIds].map(async (cityId) => {
        const partnerIds = partnerIdsByCity.get(cityId) ?? [];
        const partners = partnerIds.length;
        const customers = customersByCity.get(cityId) ?? 0;

        let bagsToday = 0;
        let ordersToday = 0;

        if (partnerIds.length) {
          const [{ count: bags }, { count: orders }] = await Promise.all([
            supabase
              .from('rescue_bags')
              .select('*', { count: 'exact', head: true })
              .eq('available_date', today)
              .in('partner_id', partnerIds),
            supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', `${today}T00:00:00`)
              .in('partner_id', partnerIds),
          ]);
          bagsToday = bags ?? 0;
          ordersToday = orders ?? 0;
        }

        return {
          id: cityId,
          name: cityId === 'unassigned' ? 'Unassigned' : cityLabel(cityId),
          partners,
          customers,
          bagsToday,
          ordersToday,
        };
      }),
    )
  )
    .filter((row) => row.partners > 0 || row.customers > 0)
    .sort((a, b) => {
      const score = (r: CityStats) => r.partners * 10 + r.customers + r.bagsToday + r.ordersToday;
      return score(b) - score(a) || a.name.localeCompare(b.name);
    });

  const totals = rows.reduce(
    (acc, row) => ({
      cities: acc.cities + 1,
      partners: acc.partners + row.partners,
      customers: acc.customers + row.customers,
      bagsToday: acc.bagsToday + row.bagsToday,
      ordersToday: acc.ordersToday + row.ordersToday,
    }),
    { cities: 0, partners: 0, customers: 0, bagsToday: 0, ordersToday: 0 },
  );

  return (
    <>
      <PageHeader
        title="Cities"
        subtitle="Live coverage worldwide — every city with partners or customers"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Active cities', value: totals.cities },
          { label: 'Partners', value: totals.partners },
          { label: 'Customers', value: totals.customers },
          { label: 'Orders today', value: totals.ordersToday },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold text-gray-900">No cities yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Cities appear here automatically when partners or customers sign up from anywhere in the
            world.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <section key={row.id} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">{row.name}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-500">
                  {row.id}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Partners</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{row.partners}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Customers</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{row.customers}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Bags today</dt>
                  <dd className="text-2xl font-semibold text-[#D85A30]">{row.bagsToday}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Orders today</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{row.ordersToday}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
