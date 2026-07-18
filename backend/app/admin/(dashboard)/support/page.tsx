import Link from 'next/link';
import { Inbox, Mail } from 'lucide-react';

import { SupportStatusActions } from '@/components/admin/SupportStatusActions';
import { PageHeader } from '@/components/admin/StatCard';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

type SupportStatus = 'new' | 'open' | 'resolved';

const STATUS_STYLE: Record<SupportStatus, string> = {
  new: 'bg-[#FEF3C7] text-[#B45309]',
  open: 'bg-[#EFF6FF] text-[#1D4ED8]',
  resolved: 'bg-[#ECFDF5] text-[#047857]',
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter =
    params.status === 'open' || params.status === 'resolved' || params.status === 'new'
      ? params.status
      : 'all';

  const supabase = createSupabaseAdmin();
  let query = supabase
    .from('support_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: messages, error } = await query;

  const [{ count: newCount }, { count: openCount }, { count: resolvedCount }] = await Promise.all([
    supabase.from('support_messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('support_messages').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved'),
  ]);

  const tabs = [
    { key: 'all', label: 'All', count: (newCount ?? 0) + (openCount ?? 0) + (resolvedCount ?? 0) },
    { key: 'new', label: 'New', count: newCount ?? 0 },
    { key: 'open', label: 'Open', count: openCount ?? 0 },
    { key: 'resolved', label: 'Resolved', count: resolvedCount ?? 0 },
  ] as const;

  return (
    <>
      <PageHeader
        title="Support"
        subtitle="Messages from Help & Support → Contact us in the app"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = filter === tab.key;
          const href = tab.key === 'all' ? '/admin/support' : `/admin/support?status=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={[
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                active
                  ? 'bg-[#D85A30] text-white'
                  : 'bg-white text-[#6B7280] border border-[#F0EDE8] hover:border-[#D85A30]/40 hover:text-[#D85A30]',
              ].join(' ')}>
              {tab.label}
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                  active ? 'bg-white/20 text-white' : 'bg-[#F5F3EF] text-[#6B7280]',
                ].join(' ')}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm text-[#B91C1C]">
          Could not load support messages. Apply migration{' '}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">040_support_messages.sql</code>{' '}
          then refresh.
        </div>
      ) : (messages ?? []).length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#E8E4DE] bg-white px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAECE7]">
            <Inbox size={24} className="text-[#D85A30]" />
          </div>
          <p className="text-base font-semibold text-[#1A1A1A]">No messages yet</p>
          <p className="mt-1 max-w-sm text-sm text-[#6B7280]">
            When customers or partners submit Contact us from Help & Support, they appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(messages ?? []).map((row) => {
            const status = (row.status ?? 'new') as SupportStatus;
            return (
              <article
                key={row.id}
                className="rounded-2xl border border-[#F0EDE8] bg-white p-5 transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
                        {status}
                      </span>
                      {row.role ? (
                        <span className="rounded-full bg-[#F5F3EF] px-2.5 py-0.5 text-[11px] font-semibold capitalize text-[#6B7280]">
                          {row.role}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 text-base font-bold text-[#1A1A1A]">{row.subject}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9CA3AF]">
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} />
                        <a
                          href={`mailto:${row.email}?subject=Re: ${encodeURIComponent(row.subject)}`}
                          className="font-medium text-[#D85A30] hover:underline">
                          {row.email}
                        </a>
                      </span>
                      <span>{formatWhen(row.created_at)}</span>
                    </div>
                  </div>
                  <SupportStatusActions messageId={row.id} status={status} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">
                  {row.message}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
