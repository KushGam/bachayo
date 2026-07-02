import Link from 'next/link';

import { PageHeader, StatCard } from '@/components/admin/StatCard';
import { CategoryBadge } from '@/components/admin/StatusBadge';
import { ADMIN_CITIES, CATEGORY_LABELS } from '@/lib/admin/constants';
import { cityLabel, formatRelativeDays, todayIso, weekAgoIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminOverviewPage() {
  const supabase = createSupabaseAdmin();
  const today = todayIso();
  const weekAgo = weekAgoIso();

  const [
    { count: totalPartners },
    { count: activeSubs },
    { count: trialSubs },
    { count: pastDueSubs },
    { count: totalCustomers },
    { count: partnersThisWeek },
    { count: customersThisWeek },
    { count: bagsToday },
    { count: ordersToday },
    { count: ordersPending },
    { count: trialExpiring },
    { data: recentPartners },
  ] = await Promise.all([
    supabase.from('partners').select('*', { count: 'exact', head: true }),
    supabase.from('partners').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    supabase.from('partners').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
    supabase.from('partners').select('*', { count: 'exact', head: true }).eq('subscription_status', 'past_due'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('partners').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').gte('created_at', weekAgo),
    supabase.from('rescue_bags').select('*', { count: 'exact', head: true }).eq('available_date', today),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`).eq('status', 'confirmed'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`).eq('status', 'confirmed'),
    supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', new Date(Date.now() + 7 * 86400000).toISOString()),
    supabase
      .from('partners')
      .select('id, name, category, city_id, created_at')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const cityRows = await Promise.all(
    ADMIN_CITIES.map(async (city) => {
      const [{ count: partners }, { data: cityPartnerIds }] = await Promise.all([
        supabase.from('partners').select('*', { count: 'exact', head: true }).eq('city_id', city.id),
        supabase.from('partners').select('id').eq('city_id', city.id),
      ]);
      const ids = (cityPartnerIds ?? []).map((p) => p.id);
      let bags = 0;
      if (ids.length) {
        const { count } = await supabase
          .from('rescue_bags')
          .select('*', { count: 'exact', head: true })
          .eq('available_date', today)
          .in('partner_id', ids);
        bags = count ?? 0;
      }
      return { city, partners: partners ?? 0, bags, orders: 0 };
    }),
  );

  const totals = cityRows.reduce(
    (acc, row) => ({
      partners: acc.partners + row.partners,
      bags: acc.bags + row.bags,
      orders: acc.orders + row.orders,
    }),
    { partners: 0, bags: 0, orders: 0 },
  );

  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <PageHeader title="Overview" subtitle={dateLabel} />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Partners"
          value={totalPartners ?? 0}
          subtext={`+${partnersThisWeek ?? 0} this week`}
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubs ?? 0}
          subtext={`${trialSubs ?? 0} on trial, ${pastDueSubs ?? 0} past due`}
          accent="revenue"
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers ?? 0}
          subtext={`+${customersThisWeek ?? 0} this week`}
        />
        <StatCard
          title="Bags Listed Today"
          value={bagsToday ?? 0}
          subtext="Across all cities"
        />
        <StatCard
          title="Orders Today"
          value={ordersToday ?? 0}
          subtext={`${ordersPending ?? 0} pending pickup`}
          accent="revenue"
        />
        <StatCard
          title="Trial Expiring Soon"
          value={trialExpiring ?? 0}
          subtext="Need follow-up"
          accent="warning"
          className="bg-amber-50 border-amber-200"
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">City breakdown</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">City</th>
                <th className="px-4 py-3 text-right">Partners</th>
                <th className="px-4 py-3 text-right">Active Bags Today</th>
                <th className="px-4 py-3 text-right">Orders Today</th>
              </tr>
            </thead>
            <tbody>
              {cityRows.map((row) => (
                <tr key={row.city.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.city.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.partners}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.bags}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.orders}</td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-gray-900">Total</td>
                <td className="px-4 py-3 text-right">{totals.partners}</td>
                <td className="px-4 py-3 text-right">{totals.bags}</td>
                <td className="px-4 py-3 text-right">{totals.orders}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">Recent signups</h2>
          <Link href="/admin/partners" className="text-sm font-medium text-[#D85A30] hover:underline">
            View all partners
          </Link>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {(recentPartners ?? []).length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No new partners in the last 7 days.</p>
          ) : (
            (recentPartners ?? []).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/partners/${p.id}`} className="font-medium text-gray-900 hover:text-[#D85A30]">
                    {p.name}
                  </Link>
                  <CategoryBadge label={CATEGORY_LABELS[p.category] ?? p.category} />
                </div>
                <div className="text-sm text-gray-500">
                  {cityLabel(p.city_id)} · signed up {formatRelativeDays(p.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
