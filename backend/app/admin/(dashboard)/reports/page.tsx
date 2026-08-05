import Link from 'next/link';
import { Flag } from 'lucide-react';

import { ReportStatusActions } from '@/components/admin/ReportStatusActions';
import { PageHeader, StatCard } from '@/components/admin/StatCard';
import { formatActivityTime, formatDate, weekAgoIso } from '@/lib/admin/format';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
type ReportType = 'partner' | 'customer';

const STATUS_STYLE: Record<ReportStatus, string> = {
  pending: 'bg-[#FEF3C7] text-[#B45309]',
  reviewed: 'bg-[#EFF6FF] text-[#1D4ED8]',
  resolved: 'bg-[#ECFDF5] text-[#047857]',
  dismissed: 'bg-gray-100 text-gray-600',
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const typeFilter: 'all' | ReportType =
    params.type === 'partner' || params.type === 'customer' ? params.type : 'all';
  const statusFilter: 'all' | ReportStatus =
    params.status === 'pending' ||
    params.status === 'reviewed' ||
    params.status === 'resolved' ||
    params.status === 'dismissed'
      ? params.status
      : 'all';

  const supabase = createSupabaseAdmin();
  const weekAgo = weekAgoIso();

  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (typeFilter !== 'all') query = query.eq('reported_type', typeFilter);
  if (statusFilter !== 'all') query = query.eq('status', statusFilter);

  const [
    { data: rows, error },
    { count: total },
    { count: pendingCount },
    { count: weekCount },
  ] = await Promise.all([
    query,
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo),
  ]);

  const reports = rows ?? [];
  const reporterIds = [...new Set(reports.map((r) => r.reporter_id).filter(Boolean))] as string[];
  const partnerIds = reports
    .filter((r) => r.reported_type === 'partner')
    .map((r) => r.reported_id);
  const customerIds = reports
    .filter((r) => r.reported_type === 'customer')
    .map((r) => r.reported_id);

  const [{ data: reporters }, { data: partners }, { data: customers }] = await Promise.all([
    reporterIds.length
      ? supabase.from('profiles').select('id, full_name, phone').in('id', reporterIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; phone: string | null }[] }),
    partnerIds.length
      ? supabase.from('partners').select('id, name').in('id', [...new Set(partnerIds)])
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    customerIds.length
      ? supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', [...new Set(customerIds)])
      : Promise.resolve({
          data: [] as { id: string; full_name: string | null; phone: string | null }[],
        }),
  ]);

  const reporterMap = new Map((reporters ?? []).map((p) => [p.id, p]));
  const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]));
  const customerMap = new Map((customers ?? []).map((p) => [p.id, p]));

  const typeTabs = [
    { key: 'all', label: 'All' },
    { key: 'partner', label: 'Partner reports' },
    { key: 'customer', label: 'Customer reports' },
  ] as const;

  const statusTabs = [
    { key: 'all', label: 'All statuses' },
    { key: 'pending', label: 'Pending' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'resolved', label: 'Resolved' },
  ] as const;

  function hrefFor(nextType: string, nextStatus: string) {
    const q = new URLSearchParams();
    if (nextType !== 'all') q.set('type', nextType);
    if (nextStatus !== 'all') q.set('status', nextStatus);
    const s = q.toString();
    return s ? `/admin/reports?${s}` : '/admin/reports';
  }

  return (
    <>
      <PageHeader title="Reports" subtitle="Safety reports from customers and partners" />

      {error ? (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}. Run migration 067_reports.sql if the table is missing.
        </p>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total reports" value={total ?? 0} />
        <StatCard title="Pending" value={pendingCount ?? 0} />
        <StatCard title="This week" value={weekCount ?? 0} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {typeTabs.map((tab) => {
          const active = typeFilter === tab.key;
          return (
            <Link
              key={tab.key}
              href={hrefFor(tab.key, statusFilter)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-semibold',
                active ? 'bg-[#D85A30] text-white' : 'bg-white text-gray-600 border border-gray-200',
              ].join(' ')}>
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <Link
              key={tab.key}
              href={hrefFor(typeFilter, tab.key)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-semibold',
                active ? 'bg-[#1A1A1A] text-white' : 'bg-white text-gray-600 border border-gray-200',
              ].join(' ')}>
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Reporter</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Reported</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <Flag className="mx-auto mb-2 opacity-40" size={28} />
                  No reports yet
                </td>
              </tr>
            ) : (
              reports.map((row) => {
                const reporter = row.reporter_id ? reporterMap.get(row.reporter_id) : null;
                const reported =
                  row.reported_type === 'partner'
                    ? partnerMap.get(row.reported_id)
                    : customerMap.get(row.reported_id);
                const reportedLabel =
                  row.reported_type === 'partner'
                    ? ((reported as { name?: string } | undefined)?.name ?? row.reported_id.slice(0, 8))
                    : ((reported as { full_name?: string | null; phone?: string | null } | undefined)
                        ?.full_name ??
                      (reported as { phone?: string | null } | undefined)?.phone ??
                      row.reported_id.slice(0, 8));
                const status = (row.status ?? 'pending') as ReportStatus;

                return (
                  <tr key={row.id} className="border-t border-gray-100 align-top hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {reporter?.full_name ?? reporter?.phone ?? 'Unknown'}
                      </div>
                      {row.details ? (
                        <p className="mt-1 max-w-[14rem] text-xs text-gray-500 line-clamp-2">
                          {row.details}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{row.reported_type}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{reportedLabel}</td>
                    <td className="px-4 py-3 text-gray-700">{row.reason}</td>
                    <td className="px-4 py-3 text-gray-500" title={formatDate(row.created_at)}>
                      {formatActivityTime(row.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-2">
                        {row.order_id ? (
                          <Link
                            href={`/admin/orders?q=${row.order_id}`}
                            className="text-xs font-semibold text-[#D85A30] hover:underline">
                            View order
                          </Link>
                        ) : null}
                        <ReportStatusActions
                          reportId={row.id}
                          status={status}
                          reportedType={row.reported_type as ReportType}
                          reportedId={row.reported_id}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
