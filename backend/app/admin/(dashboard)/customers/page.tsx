import Link from 'next/link';

import { CustomerActions } from '@/components/admin/CustomerActions';
import { PageHeader, StatCard } from '@/components/admin/StatCard';
import { fetchActiveCityOptions } from '@/lib/admin/cities';
import { cityLabel, formatRelativeDays, weekAgoIso, todayIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const params = await searchParams;
  const supabase = createSupabaseAdmin();
  const weekAgo = weekAgoIso();
  const today = todayIso();

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(100);

  if (params.city) query = query.eq('city_id', params.city);
  if (params.q) query = query.or(`full_name.ilike.%${params.q}%,phone.ilike.%${params.q}%`);

  const [
    { count: total },
    { count: newWeek },
    { count: ordersToday },
    { data: customers },
    cities,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').gte('created_at', weekAgo),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
    query,
    fetchActiveCityOptions(supabase),
  ]);

  const customerIds = (customers ?? []).map((c) => c.id);
  const { data: orderStats } = customerIds.length
    ? await supabase.from('orders').select('customer_id, created_at').in('customer_id', customerIds)
    : { data: [] };

  const ordersByCustomer = new Map<string, { count: number; last: string }>();
  for (const o of orderStats ?? []) {
    const prev = ordersByCustomer.get(o.customer_id) ?? { count: 0, last: o.created_at };
    ordersByCustomer.set(o.customer_id, {
      count: prev.count + 1,
      last: new Date(o.created_at) > new Date(prev.last) ? o.created_at : prev.last,
    });
  }

  return (
    <>
      <PageHeader title="Customers" subtitle="Customer accounts and order activity" />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total customers" value={total ?? 0} />
        <StatCard title="New this week" value={newWeek ?? 0} />
        <StatCard title="Orders today" value={ordersToday ?? 0} />
        <StatCard title="Listed below" value={customers?.length ?? 0} subtext="Max 100 shown" />
      </div>

      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search name or phone…"
          className="min-w-[200px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select name="city" defaultValue={params.city} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-[#D85A30] px-4 py-2 text-sm font-medium text-white">
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-left">Last order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => {
              const stats = ordersByCustomer.get(c.id);
              return (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="font-medium text-gray-900 hover:text-[#D85A30]">
                      {c.full_name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3">{cityLabel(c.city_id)}</td>
                  <td className="px-4 py-3">{formatRelativeDays(c.created_at)}</td>
                  <td className="px-4 py-3 text-right">{stats?.count ?? 0}</td>
                  <td className="px-4 py-3">{stats?.last ? formatRelativeDays(stats.last) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <CustomerActions profileId={c.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
