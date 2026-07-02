'use client';

import { useTransition } from 'react';

import { convertTrialPartner } from '@/app/admin/actions';

export function TrialPipelineActions({ partnerId }: { partnerId: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => convertTrialPartner(partnerId, 30))}
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50">
        Extend 30d
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => convertTrialPartner(partnerId))}
        className="rounded-lg bg-[#D85A30] px-2 py-1 text-xs font-medium text-white hover:bg-[#993C1D]">
        Mark converted
      </button>
    </div>
  );
}
