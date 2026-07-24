'use client';

import { useTransition } from 'react';

import { markAdminOrderPickedUp } from '@/app/admin/actions';

export function MarkPickedUpButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => markAdminOrderPickedUp(orderId))}
      className="rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#059669] disabled:opacity-60">
      {pending ? 'Saving…' : 'Mark picked up'}
    </button>
  );
}
