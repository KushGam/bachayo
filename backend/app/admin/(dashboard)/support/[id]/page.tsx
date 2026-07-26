import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, User } from 'lucide-react';

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

export default async function AdminSupportMessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const { data: row, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !row) notFound();

  // Opening a new message marks it open so the sidebar badge clears.
  if (row.status === 'new') {
    await supabase
      .from('support_messages')
      .update({ status: 'open' })
      .eq('id', id)
      .eq('status', 'new');
    row.status = 'open';
  }

  const status = (row.status ?? 'open') as SupportStatus;

  let profileName: string | null = null;
  if (row.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', row.user_id)
      .maybeSingle();
    profileName = profile?.full_name ?? profile?.phone ?? null;
  }

  return (
    <>
      <Link
        href="/admin/support"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] transition hover:text-[#D85A30]">
        <ArrowLeft size={16} />
        Back to Support
      </Link>

      <PageHeader title={row.subject} subtitle={`Received ${formatWhen(row.created_at)}`} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
        <SupportStatusActions messageId={row.id} status={status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <article className="rounded-2xl border border-[#F0EDE8] bg-white p-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">Message</h2>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-[#1A1A1A]">
            {row.message}
          </p>
        </article>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#F0EDE8] bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">From</h2>
            <a
              href={`mailto:${row.email}?subject=Re: ${encodeURIComponent(row.subject)}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#D85A30] hover:underline">
              <Mail size={14} />
              {row.email}
            </a>
            {profileName ? (
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#6B7280]">
                <User size={14} />
                {profileName}
              </p>
            ) : null}
            {row.user_id ? (
              <p className="mt-2 break-all font-mono text-[11px] text-[#9CA3AF]">{row.user_id}</p>
            ) : null}
          </div>

          {row.admin_notes ? (
            <div className="rounded-2xl border border-[#F0EDE8] bg-white p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">
                Admin notes
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#374151]">{row.admin_notes}</p>
            </div>
          ) : null}

          {row.resolved_at ? (
            <p className="text-xs text-[#9CA3AF]">Resolved {formatWhen(row.resolved_at)}</p>
          ) : null}
        </aside>
      </div>
    </>
  );
}
