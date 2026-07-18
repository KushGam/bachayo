import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  CreditCard,
  Inbox,
  MapPin,
  ShoppingBag,
  Users,
} from 'lucide-react';

import { PageHeader, StatCard } from '@/components/admin/StatCard';
import { CategoryBadge } from '@/components/admin/StatusBadge';
import { ADMIN_CITIES, CATEGORY_LABELS } from '@/lib/admin/constants';
import { cityLabel, formatRelativeDays, todayIso, weekAgoIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

function tableNumberClass(value: number) {
  return value === 0 ? 'text-[#9CA3AF] font-medium' : 'font-semibold text-[#1A1A1A]';
}

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
    supportResult,
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
    supabase.from('support_messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
  ]);

  const newSupport = supportResult.error ? 0 : (supportResult.count ?? 0);

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
      <PageHeader title="Overview" subtitle={dateLabel} showLive />

      {newSupport > 0 ? (
        <Link
          href="/admin/support?status=new"
          className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#F5D98A] bg-[#FFFBEB] px-5 py-4 transition hover:bg-[#FEF3C7]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF3C7]">
              <Inbox size={18} className="text-[#B45309]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#92400E]">
                {newSupport} new support message{newSupport === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-[#B45309]">From Help & Support in the app</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-[#D85A30]">Open inbox →</span>
        </Link>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Partners"
          value={totalPartners ?? 0}
          subtext={`+${partnersThisWeek ?? 0} this week`}
          icon={Building2}
          iconBg="#FAECE7"
          iconColor="#D85A30"
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubs ?? 0}
          subtext={`${trialSubs ?? 0} on trial, ${pastDueSubs ?? 0} past due`}
          icon={CreditCard}
          iconBg="#ECFDF5"
          iconColor="#10B981"
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers ?? 0}
          subtext={`+${customersThisWeek ?? 0} this week`}
          icon={Users}
          iconBg="#EFF6FF"
          iconColor="#3B82F6"
        />
        <StatCard
          title="Bags Listed Today"
          value={bagsToday ?? 0}
          subtext="Across all cities"
          icon={ShoppingBag}
          iconBg="#FAECE7"
          iconColor="#D85A30"
        />
        <StatCard
          title="Orders Today"
          value={ordersToday ?? 0}
          subtext={`${ordersPending ?? 0} pending pickup`}
          icon={CheckCircle}
          iconBg="#F0FDF4"
          iconColor="#10B981"
        />
        <StatCard
          title="Trial Expiring Soon"
          value={trialExpiring ?? 0}
          subtext="Need follow-up"
          icon={AlertTriangle}
          iconBg="#FEF3C7"
          iconColor="#F59E0B"
        />
      </div>

      <section className="mb-8">
        <h2 className="admin-section-label">City breakdown</h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-[#F0EDE8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <table className="min-w-full">
            <thead className="border-b border-[#F0EDE8] bg-[#FFFCFA]">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  City
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  Partners
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  Active Bags Today
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  Orders Today
                </th>
              </tr>
            </thead>
            <tbody>
              {cityRows.map((row) => (
                <tr
                  key={row.city.id}
                  className="border-b border-[#F5F3EF] transition-colors duration-150 hover:bg-[#FAFAF8]">
                  <td className="px-5 py-3.5 text-sm text-[#1A1A1A]">
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#D85A30]" />
                      {row.city.name}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-right text-sm ${tableNumberClass(row.partners)}`}>
                    {row.partners}
                  </td>
                  <td className={`px-5 py-3.5 text-right text-sm ${tableNumberClass(row.bags)}`}>
                    {row.bags}
                  </td>
                  <td className={`px-5 py-3.5 text-right text-sm ${tableNumberClass(row.orders)}`}>
                    {row.orders}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#F0EDE8] bg-[#FFFCFA] font-semibold">
                <td className="px-5 py-3.5 text-sm text-[#1A1A1A]">Total</td>
                <td className={`px-5 py-3.5 text-right text-sm ${tableNumberClass(totals.partners)}`}>
                  {totals.partners}
                </td>
                <td className={`px-5 py-3.5 text-right text-sm ${tableNumberClass(totals.bags)}`}>
                  {totals.bags}
                </td>
                <td className={`px-5 py-3.5 text-right text-sm ${tableNumberClass(totals.orders)}`}>
                  {totals.orders}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="admin-section-label !mb-0">Recent signups</h2>
          <Link href="/admin/partners" className="text-[13px] font-medium text-[#D85A30] hover:underline">
            View all partners →
          </Link>
        </div>
        <div className="space-y-2">
          {(recentPartners ?? []).length === 0 ? (
            <p className="rounded-xl border border-[#F0EDE8] bg-white px-4 py-6 text-sm text-[#6B7280]">
              No new partners in the last 7 days.
            </p>
          ) : (
            (recentPartners ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-[#F0EDE8] bg-white p-4 transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAECE7] text-sm font-bold text-[#D85A30]">
                  {getInitials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/partners/${p.id}`}
                    className="text-sm font-semibold text-[#1A1A1A] hover:text-[#D85A30]">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    {CATEGORY_LABELS[p.category] ?? p.category} · {cityLabel(p.city_id)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-xs text-[#9CA3AF]">
                    signed up {formatRelativeDays(p.created_at)}
                  </span>
                  <CategoryBadge
                    label={CATEGORY_LABELS[p.category] ?? p.category}
                    category={p.category}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
