import Link from 'next/link';

import { MarkPickedUpButton } from '@/components/admin/MarkPickedUpButton';
import { PageHeader, StatCard } from '@/components/admin/StatCard';
import {
  cityLabel,
  formatClockTime,
  formatNpr,
  startOfMonthIso,
  todayIso,
  weekAgoIso,
} from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 60;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function statusBadge(status: string) {
  switch (status) {
    case 'confirmed':
    case 'pending':
      return {
        label: status === 'pending' ? 'Pending' : 'Waiting',
        className: 'bg-[#FEF3C7] text-[#92400E]',
      };
    case 'picked_up':
      return { label: 'Done ✓', className: 'bg-[#ECFDF5] text-[#065F46]' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'bg-[#F3F4F6] text-[#6B7280]' };
    case 'missed':
      return { label: 'No show', className: 'bg-[#FEE2E2] text-[#991B1B]' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-600' };
  }
}

function rangeStart(range: string) {
  if (range === 'week') return weekAgoIso();
  if (range === 'month') return `${startOfMonthIso()}T00:00:00`;
  return `${todayIso()}T00:00:00`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; status?: string; city?: string }>;
}) {
  const params = await searchParams;
  const range = params.range === 'week' || params.range === 'month' ? params.range : 'today';
  const status =
    params.status === 'confirmed' ||
    params.status === 'picked_up' ||
    params.status === 'cancelled' ||
    params.status === 'missed'
      ? params.status
      : 'all';
  const city = params.city || '';

  const supabase = createSupabaseAdmin();
  const today = todayIso();
  const todayStart = `${today}T00:00:00`;
  const from = rangeStart(range);

  const [
    { count: confirmedToday },
    { count: pickedUpToday },
    { count: cancelledToday },
    { count: missedToday },
    { data: orders },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('created_at', todayStart),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'picked_up')
      .gte('picked_up_at', todayStart),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('cancelled_at', todayStart),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'missed')
      .gte('created_at', todayStart),
    supabase
      .from('orders')
      .select(
        `
        id, created_at, status, quantity, total_price, picked_up_at,
        customer:profiles!customer_id (full_name, phone),
        bag:rescue_bags (
          title, rescue_price, pickup_start, pickup_end,
          partners (name, city_id)
        )
      `,
      )
      .gte('created_at', from)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  type OrderRow = NonNullable<typeof orders>[number];

  const filtered = ((orders ?? []) as OrderRow[]).filter((order) => {
    if (status !== 'all' && order.status !== status) return false;
    if (!city) return true;
    const bag = one(
      order.bag as
        | {
            partners?: { city_id?: string | null } | { city_id?: string | null }[];
          }
        | {
            partners?: { city_id?: string | null } | { city_id?: string | null }[];
          }[],
    );
    const partner = one(bag?.partners);
    return partner?.city_id === city;
  });

  const totalValue = filtered.reduce((sum, o) => sum + (o.total_price ?? 0), 0) / 100;
  const pickedUpCount = filtered.filter((o) => o.status === 'picked_up').length;
  const pendingCount = filtered.filter(
    (o) => o.status === 'confirmed' || o.status === 'pending',
  ).length;

  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const pill = (active: boolean) =>
    active
      ? 'rounded-full bg-[#D85A30] px-3 py-1.5 text-xs font-semibold text-white'
      : 'rounded-full border border-[#E8E4DE] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-[#D85A30]/40';

  return (
    <>
      <PageHeader title="Orders" subtitle={dateLabel} showLive />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Confirmed today"
          value={confirmedToday ?? 0}
          iconBg="#FEF3C7"
          iconColor="#F59E0B"
        />
        <StatCard
          title="Picked up today"
          value={pickedUpToday ?? 0}
          iconBg="#ECFDF5"
          iconColor="#10B981"
        />
        <StatCard
          title="Cancelled today"
          value={cancelledToday ?? 0}
          iconBg="#FEE2E2"
          iconColor="#EF4444"
        />
        <StatCard
          title="Missed today"
          value={missedToday ?? 0}
          iconBg="#F3F4F6"
          iconColor="#6B7280"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This week' },
            { key: 'month', label: 'This month' },
          ].map((item) => (
            <Link
              key={item.key}
              href={`/admin/orders?range=${item.key}${status !== 'all' ? `&status=${status}` : ''}${city ? `&city=${city}` : ''}`}
              className={pill(range === item.key)}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'picked_up', label: 'Picked up' },
            { key: 'cancelled', label: 'Cancelled' },
            { key: 'missed', label: 'Missed' },
          ].map((item) => (
            <Link
              key={item.key}
              href={`/admin/orders?range=${range}${item.key !== 'all' ? `&status=${item.key}` : ''}${city ? `&city=${city}` : ''}`}
              className={pill(status === item.key)}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: '', label: 'All cities' },
            { key: 'kathmandu', label: 'Kathmandu' },
            { key: 'lalitpur', label: 'Lalitpur' },
            { key: 'pokhara', label: 'Pokhara' },
            { key: 'bhaktapur', label: 'Bhaktapur' },
          ].map((item) => (
            <Link
              key={item.key || 'all-cities'}
              href={`/admin/orders?range=${range}${status !== 'all' ? `&status=${status}` : ''}${item.key ? `&city=${item.key}` : ''}`}
              className={pill(city === item.key)}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="mb-4 hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Bag</th>
              <th className="px-4 py-3 text-left">Partner</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No orders for this filter
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const customer = one(
                  order.customer as
                    | { full_name?: string | null; phone?: string | null }
                    | { full_name?: string | null; phone?: string | null }[],
                );
                const bag = one(
                  order.bag as
                    | {
                        title?: string | null;
                        pickup_start?: string | null;
                        pickup_end?: string | null;
                        partners?:
                          | { name?: string | null; city_id?: string | null }
                          | { name?: string | null; city_id?: string | null }[];
                      }
                    | {
                        title?: string | null;
                        pickup_start?: string | null;
                        pickup_end?: string | null;
                        partners?:
                          | { name?: string | null; city_id?: string | null }
                          | { name?: string | null; city_id?: string | null }[];
                      }[],
                );
                const partner = one(bag?.partners);
                const badge = statusBadge(order.status);
                return (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatClockTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{customer?.full_name || '—'}</p>
                      {customer?.phone ? (
                        <a
                          href={`tel:${customer.phone}`}
                          className="text-xs text-gray-400 hover:text-[#D85A30]">
                          {customer.phone}
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400">—</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{bag?.title || '—'}</p>
                      <p className="text-xs text-gray-400">
                        {bag?.pickup_start?.slice(0, 5) || '—'}–{bag?.pickup_end?.slice(0, 5) || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{partner?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{cityLabel(partner?.city_id)}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#D85A30]">
                      {formatNpr((order.total_price ?? 0) / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {order.status === 'confirmed' ? (
                        <MarkPickedUpButton orderId={order.id} />
                      ) : order.status === 'picked_up' ? (
                        <span className="text-xs font-medium text-[#065F46]">✓ Done</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-gray-400">
            No orders for this filter
          </p>
        ) : (
          filtered.map((order) => {
            const customer = one(
              order.customer as
                | { full_name?: string | null; phone?: string | null }
                | { full_name?: string | null; phone?: string | null }[],
            );
            const bag = one(
              order.bag as
                | {
                    title?: string | null;
                    pickup_start?: string | null;
                    pickup_end?: string | null;
                    partners?:
                      | { name?: string | null }
                      | { name?: string | null }[];
                  }
                | {
                    title?: string | null;
                    pickup_start?: string | null;
                    pickup_end?: string | null;
                    partners?:
                      | { name?: string | null }
                      | { name?: string | null }[];
                  }[],
            );
            const partner = one(bag?.partners);
            const badge = statusBadge(order.status);
            return (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-gray-900">{customer?.full_name || 'Customer'}</p>
                  <p className="font-bold text-[#D85A30]">
                    {formatNpr((order.total_price ?? 0) / 100)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {bag?.title || 'Bag'} · {partner?.name || 'Partner'}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400">
                    {bag?.pickup_start?.slice(0, 5) || '—'}–{bag?.pickup_end?.slice(0, 5) || '—'}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                {order.status === 'confirmed' ? (
                  <div className="mt-3">
                    <MarkPickedUpButton orderId={order.id} />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Showing {filtered.length} orders · Total value: {formatNpr(totalValue)} · {pickedUpCount}{' '}
        picked up · {pendingCount} pending
      </p>
    </>
  );
}
