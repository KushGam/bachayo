import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PartnerAccountActions } from '@/components/admin/PartnerAccountActions';
import { PartnerDetailActions } from '@/components/admin/PartnerDetailActions';
import { PageHeader } from '@/components/admin/StatCard';
import { CategoryBadge, StatusBadge } from '@/components/admin/StatusBadge';
import { CATEGORY_LABELS, TIER_PRICES_NPR } from '@/lib/admin/constants';
import {
  cityLabel,
  formatDate,
  formatDateTime,
  formatNpr,
  formatRelativeDays,
  tierLabel,
  todayIso,
  trialDaysLeft,
} from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdmin();
  const today = todayIso();

  const { data: partner, error } = await supabase.from('partners').select('*').eq('id', id).maybeSingle();
  if (error || !partner) notFound();

  const [
    { data: profile },
    { data: payments },
    { data: todayBags },
    { data: recentOrders },
    { data: reviews },
    { count: bagsCount },
    { data: fulfilledOrders },
    { data: authUser },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, phone, created_at').eq('id', partner.user_id).maybeSingle(),
    supabase
      .from('subscription_payments')
      .select('*')
      .eq('partner_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('rescue_bags')
      .select('id, title, rescue_price, pickup_start, pickup_end, status')
      .eq('partner_id', id)
      .eq('available_date', today)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, total_price, status, quantity, created_at, bag:rescue_bags(title)')
      .eq('partner_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, customer:profiles(full_name)')
      .eq('partner_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('rescue_bags').select('*', { count: 'exact', head: true }).eq('partner_id', id),
    supabase
      .from('orders')
      .select('total_price')
      .eq('partner_id', id)
      .in('status', ['confirmed', 'picked_up']),
    supabase.auth.admin.getUserById(partner.user_id),
  ]);

  const revenue = (fulfilledOrders ?? []).reduce((sum, o) => sum + (o.total_price ?? 0), 0) / 100;
  const tier = partner.subscription_tier ?? 'small';
  const tierPrice = TIER_PRICES_NPR[tier] ?? 1000;
  const status = partner.subscription_status ?? 'trial';
  const approvalStatus = (partner as { approval_status?: string }).approval_status ?? 'approved';
  const rejectionReason = (partner as { rejection_reason?: string | null }).rejection_reason;
  const suspensionReason = (partner as { suspension_reason?: string | null }).suspension_reason;
  const approvedAt = (partner as { approved_at?: string | null }).approved_at;
  const suspendedAt = (partner as { suspended_at?: string | null }).suspended_at;

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/partners" className="text-sm font-medium text-[#D85A30] hover:underline">
          ← Back to partners
        </Link>
      </div>

      <PageHeader
        title={partner.name}
        subtitle={`${CATEGORY_LABELS[partner.category] ?? partner.category} · ${cityLabel(partner.city_id)}`}
      />

      <PartnerAccountActions partnerId={id} approvalStatus={approvalStatus} variant="bar" />

      {approvalStatus === 'pending' ? (
        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            ⏳ Awaiting approval — review and approve or reject this restaurant
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Signed up {formatRelativeDays(partner.created_at)} · {partner.phone ?? 'No phone'}
          </p>
        </section>
      ) : null}

      {approvalStatus === 'approved' ? (
        <section className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">
            ✓ Approved{approvedAt ? ` on ${formatDate(approvedAt)}` : ''}
          </p>
        </section>
      ) : null}

      {approvalStatus === 'suspended' ? (
        <section className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            ⏸ Suspended{suspendedAt ? ` on ${formatDate(suspendedAt)}` : ''}
          </p>
          {suspensionReason ? (
            <p className="mt-1 text-sm text-red-700">Reason: {suspensionReason}</p>
          ) : null}
        </section>
      ) : null}

      {approvalStatus === 'rejected' ? (
        <section className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-800">✗ Rejected</p>
          {rejectionReason ? (
            <p className="mt-1 text-sm text-gray-600">Reason: {rejectionReason}</p>
          ) : null}
        </section>
      ) : null}

      {approvalStatus === 'deleted' ? (
        <section className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-700">🗑 Account deleted (soft delete — data retained)</p>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Business info</h2>
            {partner.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={partner.cover_image_url}
                alt=""
                className="mb-4 h-32 w-full rounded-lg object-cover"
              />
            ) : null}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Category</dt>
                <dd><CategoryBadge label={CATEGORY_LABELS[partner.category] ?? partner.category} /></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Address</dt>
                <dd className="text-right text-gray-900">{partner.address ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{partner.phone ?? '—'}</dd>
              </div>
            </dl>
            <a
              href={`https://www.google.com/maps?q=${partner.latitude},${partner.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm font-medium text-[#D85A30] hover:bg-gray-100">
              View location on map ({partner.latitude.toFixed(4)}, {partner.longitude.toFixed(4)})
            </a>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Owner</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd>{profile?.full_name ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd>{profile?.phone ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{authUser?.user?.email ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Joined</dt><dd>{formatDate(profile?.created_at ?? partner.created_at)}</dd></div>
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Subscription</h2>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">{tierLabel(tier)} · {formatNpr(tierPrice)}/mo</span>
              <StatusBadge
                status={status}
                label={status === 'trial' ? `Trial (${trialDaysLeft(partner.trial_ends_at)}d left)` : status.replace('_', ' ')}
              />
            </div>
            <p className="mb-4 text-sm text-gray-600">
              {status === 'trial'
                ? `Trial ends ${formatDate(partner.trial_ends_at)}`
                : `Renews ${formatDate(partner.current_period_end)}`}
            </p>
            <PartnerDetailActions partnerId={id} tier={tier as 'small' | 'medium' | 'large'} isActive={partner.is_active} />

            <h3 className="mb-2 mt-6 text-xs font-medium uppercase text-gray-500">Payment history</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Amount</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {(payments ?? []).map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="py-2">{formatDateTime(p.created_at)}</td>
                      <td className="py-2">{formatNpr(p.amount)}</td>
                      <td className="py-2"><StatusBadge status={p.status} /></td>
                      <td className="py-2">{p.payment_method ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Activity</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Bags listed</p><p className="text-xl font-semibold">{bagsCount ?? 0}</p></div>
              <div><p className="text-gray-500">Orders fulfilled</p><p className="text-xl font-semibold">{fulfilledOrders?.length ?? 0}</p></div>
              <div><p className="text-gray-500">Revenue generated</p><p className="text-xl font-semibold">{formatNpr(revenue)}</p></div>
              <div><p className="text-gray-500">Avg rating</p><p className="text-xl font-semibold">★ {partner.rating?.toFixed(1) ?? '0.0'}</p></div>
            </div>
          </section>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Today&apos;s bags</h2>
        {(todayBags ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No bags listed today.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {(todayBags ?? []).map((b) => (
              <li key={b.id} className="flex justify-between py-2">
                <span>{b.title}</span>
                <span className="text-gray-500">{b.pickup_start?.slice(0, 5)}–{b.pickup_end?.slice(0, 5)} · {formatNpr(b.rescue_price / 100)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Recent orders</h2>
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2 text-left">Date</th>
              <th className="py-2 text-left">Bag</th>
              <th className="py-2 text-left">Qty</th>
              <th className="py-2 text-left">Amount</th>
              <th className="py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {(recentOrders ?? []).map((o) => {
              const bag = Array.isArray(o.bag) ? o.bag[0] : o.bag;
              return (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="py-2">{formatRelativeDays(o.created_at)}</td>
                  <td className="py-2">{bag?.title ?? '—'}</td>
                  <td className="py-2">{o.quantity}</td>
                  <td className="py-2">{formatNpr(o.total_price / 100)}</td>
                  <td className="py-2"><StatusBadge status={o.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Reviews</h2>
        {(reviews ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {(reviews ?? []).map((r) => {
              const customer = Array.isArray(r.customer) ? r.customer[0] : r.customer;
              return (
                <li key={r.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">★ {r.rating} · {customer?.full_name ?? 'Customer'}</span>
                    <span className="text-gray-500">{formatRelativeDays(r.created_at)}</span>
                  </div>
                  {r.comment ? <p className="mt-1 text-gray-600">{r.comment}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
