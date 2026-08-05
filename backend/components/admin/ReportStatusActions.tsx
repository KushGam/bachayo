'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import {
  banReportedUser,
  updateReportStatus,
} from '@/app/admin/actions';

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export function ReportStatusActions({
  reportId,
  status,
  reportedType,
  reportedId,
}: {
  reportId: string;
  status: ReportStatus;
  reportedType: 'partner' | 'customer';
  reportedId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function setStatus(next: ReportStatus) {
    start(async () => {
      await updateReportStatus(reportId, next);
      router.refresh();
    });
  }

  function ban() {
    const label = reportedType === 'partner' ? 'restaurant' : 'customer';
    if (!confirm(`Ban / suspend this ${label}? They will lose access until reactivated.`)) {
      return;
    }
    start(async () => {
      await banReportedUser(reportedType, reportedId);
      await updateReportStatus(reportId, 'resolved');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {status === 'pending' ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus('reviewed')}
          className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8] disabled:opacity-60">
          Mark reviewed
        </button>
      ) : null}
      {status !== 'resolved' ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus('resolved')}
          className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#059669] disabled:opacity-60">
          Resolve
        </button>
      ) : null}
      {status !== 'dismissed' ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus('dismissed')}
          className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 disabled:opacity-60">
          Dismiss
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={ban}
        className="rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-semibold text-[#DC2626] disabled:opacity-60">
        Ban user
      </button>
    </div>
  );
}
