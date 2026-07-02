import { PageHeader } from '@/components/admin/StatCard';
import { ADMIN_CITIES } from '@/lib/admin/constants';
import { todayIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminCitiesPage() {
  const supabase = createSupabaseAdmin();
  const today = todayIso();

  const rows = await Promise.all(
    ADMIN_CITIES.map(async (city) => {
      const [{ count: partners }, { count: customers }, { data: partnerIds }, { count: orders }] =
        await Promise.all([
          supabase.from('partners').select('*', { count: 'exact', head: true }).eq('city_id', city.id),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('city_id', city.id).eq('role', 'customer'),
          supabase.from('partners').select('id').eq('city_id', city.id),
          supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
        ]);

      const ids = (partnerIds ?? []).map((p) => p.id);
      let bagsToday = 0;
      if (ids.length) {
        const { count } = await supabase
          .from('rescue_bags')
          .select('*', { count: 'exact', head: true })
          .eq('available_date', today)
          .in('partner_id', ids);
        bagsToday = count ?? 0;
      }

      return {
        city,
        partners: partners ?? 0,
        customers: customers ?? 0,
        bagsToday,
        ordersToday: orders ?? 0,
      };
    }),
  );

  return (
    <>
      <PageHeader title="Cities" subtitle="Multi-city coverage and daily activity" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <section key={row.city.id} className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">{row.city.name}</h2>
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
                <dt className="text-gray-500">Orders today (all)</dt>
                <dd className="text-2xl font-semibold text-gray-900">{row.ordersToday}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
