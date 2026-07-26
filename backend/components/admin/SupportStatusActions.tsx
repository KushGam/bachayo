'use client';

import { useRouter } from 'next/navigation';
import { useTransition, type MouseEvent } from 'react';

import { updateSupportMessageStatus } from '@/app/admin/actions';

type SupportStatus = 'new' | 'open' | 'resolved';

export function SupportStatusActions({
  messageId,
  status,
}: {
  messageId: string;
  status: SupportStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(next: SupportStatus, event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    startTransition(async () => {
      await updateSupportMessageStatus(messageId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
      {status === 'new' ? (
        <button
          type="button"
          disabled={pending}
          onClick={(e) => setStatus('open', e)}
          className="rounded-full bg-[#FAECE7] px-3 py-1.5 text-xs font-semibold text-[#D85A30] transition hover:bg-[#F0DDD4] disabled:opacity-60">
          Mark open
        </button>
      ) : null}
      {status !== 'resolved' ? (
        <button
          type="button"
          disabled={pending}
          onClick={(e) => setStatus('resolved', e)}
          className="rounded-full bg-[#ECFDF5] px-3 py-1.5 text-xs font-semibold text-[#059669] transition hover:bg-[#D1FAE5] disabled:opacity-60">
          Resolve
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={(e) => setStatus('open', e)}
          className="rounded-full bg-[#F5F3EF] px-3 py-1.5 text-xs font-semibold text-[#6B7280] transition hover:bg-[#EBE6DF] disabled:opacity-60">
          Reopen
        </button>
      )}
    </div>
  );
}
