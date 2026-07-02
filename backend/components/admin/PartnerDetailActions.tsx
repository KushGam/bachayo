'use client';

import { useState, useTransition } from 'react';

import {
  changePartnerTier,
  extendPartnerTrial,
  markPartnerPaid,
  reactivatePartner,
  suspendPartner,
} from '@/app/admin/actions';

export function PartnerDetailActions({
  partnerId,
  tier,
  isActive,
}: {
  partnerId: string;
  tier: 'small' | 'medium' | 'large';
  isActive: boolean;
}) {
  const [days, setDays] = useState(7);
  const [newTier, setNewTier] = useState(tier);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
          <option value={7}>+7 days</option>
          <option value={14}>+14 days</option>
          <option value={30}>+30 days</option>
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => extendPartnerTrial(partnerId, days))}
          className="rounded-lg bg-[#D85A30] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#993C1D]">
          Extend trial
        </button>
      </div>
      <select
        value={newTier}
        onChange={(e) => setNewTier(e.target.value as 'small' | 'medium' | 'large')}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => changePartnerTier(partnerId, newTier))}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
        Change tier
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => markPartnerPaid(partnerId))}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
        Mark as paid
      </button>
      {isActive ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm('Suspend this partner?')) start(() => suspendPartner(partnerId));
          }}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
          Suspend
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => reactivatePartner(partnerId))}
          className="rounded-lg border border-green-200 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50">
          Reactivate
        </button>
      )}
    </div>
  );
}
