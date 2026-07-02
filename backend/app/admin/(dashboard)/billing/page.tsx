import Link from 'next/link';

import { ManualPaymentForm } from '@/components/admin/ManualPaymentForm';
import { TrialPipelineActions } from '@/components/admin/TrialPipelineActions';
import { PageHeader, StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { TIER_PRICES_NPR } from '@/lib/admin/constants';
import { cityLabel, formatDate, formatDateTime, formatNpr, startOfMonthIso, trialDaysLeft } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = createSupabaseAdmin();
  const monthStart = params.month ? `${params.month}-01` : startOfMonthIso();

  const { data: activePartners } = await supabase
    .from('partners')
    .select('subscription_tier')
    .eq('subscription_status', 'active');

  const mrr = (activePartners ?? []).reduce((sum, p) => {
    const tier = (p.subscription_tier ?? 'small') as keyof typeof TIER_PRICES_NPR;
    return sum + (TIER_PRICES_NPR[tier] ?? 0);
  }, 0);

  const { data: monthPayments } = await supabase
    .from('subscription_payments')
    .select('amount')
    .eq('status', 'paid')
    .gte('period_start', monthStart);

  const collected = (monthPayments ?? []).reduce((sum, p) => sum + p.amount, 0);

  const { data: pastDuePartners } = await supabase
    .from('partners')
    .select('subscription_tier')
    .eq('subscription_status', 'past_due');

  const outstanding = (pastDuePartners ?? []).reduce((sum, p) => {
    const tier = (p.subscription_tier ?? 'small') as keyof typeof TIER_PRICES_NPR;
    return sum + (TIER_PRICES_NPR[tier] ?? 0);
  }, 0);

  const monthStartDate = new Date(monthStart);
  const { count: conversions } = await supabase
    .from('subscription_payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'paid')
    .gte('created_at', monthStartDate.toISOString());

  const { data: trialEnding } = await supabase
    .from('partners')
    .select('id, name, city_id, phone, subscription_tier, trial_ends_at, subscription_status')
    .eq('subscription_status', 'trial')
    .order('trial_ends_at', { ascending: true })
    .limit(50);

  let paymentsQuery = supabase
    .from('subscription_payments')
    .select('*, partner:partners(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (params.status) paymentsQuery = paymentsQuery.eq('status', params.status);
  if (params.month) paymentsQuery = paymentsQuery.gte('period_start', monthStart);

  const { data: payments } = await paymentsQuery;

  const { data: allPartners } = await supabase
    .from('partners')
    .select('id, name, subscription_tier')
    .order('name');

  return (
    <>
      <PageHeader title="Billing" subtitle="Revenue, trials, and payment tracking" />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="MRR" value={formatNpr(mrr)} />
        <StatCard title="Collected this month" value={formatNpr(collected)} />
        <StatCard title="Outstanding" value={formatNpr(outstanding)} />
        <StatCard title="Trial conversions" value={conversions ?? 0} subtext="Paid this month" />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase text-gray-500">Trials ending soon — follow up</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Partner</th>
                <th className="px-4 py-3 text-left">City</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-left">Trial ends</th>
                <th className="px-4 py-3 text-left">Days left</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {(trialEnding ?? []).map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/partners/${p.id}`} className="font-medium text-[#D85A30] hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{cityLabel(p.city_id)}</td>
                  <td className="px-4 py-3 capitalize">{p.subscription_tier}</td>
                  <td className="px-4 py-3">{formatDate(p.trial_ends_at)}</td>
                  <td className="px-4 py-3 font-medium text-amber-700">{trialDaysLeft(p.trial_ends_at)}</td>
                  <td className="px-4 py-3">
                    {p.phone ? (
                      <a href={`tel:${p.phone}`} className="text-[#D85A30] hover:underline">
                        {p.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TrialPipelineActions partnerId={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase text-gray-500">Payment history</h2>
          <a
            href={`/api/admin/export/payments?${new URLSearchParams(params as Record<string, string>).toString()}`}
            className="text-sm font-medium text-[#D85A30] hover:underline">
            Export CSV
          </a>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Partner</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).map((p) => {
                const partner = Array.isArray(p.partner) ? p.partner[0] : p.partner;
                return (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDateTime(p.created_at)}</td>
                    <td className="px-4 py-3">{partner?.name ?? '—'}</td>
                    <td className="px-4 py-3 capitalize">{p.tier}</td>
                    <td className="px-4 py-3">{formatNpr(p.amount)}</td>
                    <td className="px-4 py-3">{p.payment_method ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ManualPaymentForm partners={allPartners ?? []} tierPrices={TIER_PRICES_NPR} />
    </>
  );
}
