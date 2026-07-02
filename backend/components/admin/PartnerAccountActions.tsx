'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import {
  changePartnerTier,
  extendPartnerTrial,
  markPartnerPaid,
} from '@/app/admin/actions';
import { ReasonModal, type ReasonModalAction } from '@/components/admin/ReasonModal';

type PartnerAction = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete';

type PartnerAccountActionsProps = {
  partnerId: string;
  approvalStatus: string;
  variant?: 'menu' | 'bar';
};

async function runPartnerAction(partnerId: string, action: PartnerAction, reason?: string) {
  const response = await fetch('/api/admin/partners/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ partnerId, action, reason }),
  });
  const data = (await response.json()) as { success?: boolean; error?: string };
  if (!response.ok || !data.success) {
    throw new Error(data.error ?? 'Action failed');
  }
}

export function PartnerAccountActions({
  partnerId,
  approvalStatus,
  variant = 'menu',
}: PartnerAccountActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reasonModal, setReasonModal] = useState<ReasonModalAction | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    (action: PartnerAction, actionReason?: string) => {
      start(async () => {
        setError(null);
        try {
          await runPartnerAction(partnerId, action, actionReason);
          setMenuOpen(false);
          setReasonModal(null);
          setReason('');
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Action failed');
        }
      });
    },
    [partnerId, router],
  );

  const confirmDelete = useCallback(() => {
    const first = confirm('Delete this partner account? Their data will be kept for records.');
    if (!first) return;
    const second = confirm('This cannot be undone. Delete account permanently?');
    if (!second) return;
    execute('delete');
  }, [execute]);

  const openReasonModal = (action: ReasonModalAction) => {
    setReason('');
    setReasonModal(action);
    setMenuOpen(false);
  };

  const menuItems: Array<{ label: string; onClick: () => void; className?: string }> = [];

  if (approvalStatus === 'pending') {
    menuItems.push(
      { label: '✓ Approve', onClick: () => execute('approve') },
      { label: '✗ Reject', onClick: () => openReasonModal('reject'), className: 'text-red-600' },
    );
  } else if (approvalStatus === 'approved') {
    menuItems.push(
      { label: '⏸ Suspend account', onClick: () => openReasonModal('suspend'), className: 'text-amber-700' },
      { label: '🗑 Delete account', onClick: confirmDelete, className: 'text-red-600' },
    );
  } else if (approvalStatus === 'suspended') {
    menuItems.push(
      { label: '✓ Reactivate account', onClick: () => execute('reactivate') },
      { label: '🗑 Delete account', onClick: confirmDelete, className: 'text-red-600' },
    );
  } else if (approvalStatus === 'rejected') {
    menuItems.push(
      { label: '✓ Approve anyway', onClick: () => execute('approve') },
      { label: '🗑 Delete account', onClick: confirmDelete, className: 'text-red-600' },
    );
  } else if (approvalStatus === 'deleted') {
    menuItems.push({ label: '✓ Re-approve account', onClick: () => execute('approve') });
  }

  const subscriptionItems =
    approvalStatus === 'approved' || approvalStatus === 'suspended'
      ? [
          {
            label: 'Extend trial +7d',
            onClick: () =>
              start(async () => {
                await extendPartnerTrial(partnerId, 7);
                router.refresh();
              }),
          },
          {
            label: 'Extend trial +14d',
            onClick: () =>
              start(async () => {
                await extendPartnerTrial(partnerId, 14);
                router.refresh();
              }),
          },
          {
            label: 'Mark as paid',
            onClick: () =>
              start(async () => {
                await markPartnerPaid(partnerId);
                router.refresh();
              }),
          },
          {
            label: 'Tier: Small',
            onClick: () =>
              start(async () => {
                await changePartnerTier(partnerId, 'small');
                router.refresh();
              }),
          },
          {
            label: 'Tier: Medium',
            onClick: () =>
              start(async () => {
                await changePartnerTier(partnerId, 'medium');
                router.refresh();
              }),
          },
          {
            label: 'Tier: Large',
            onClick: () =>
              start(async () => {
                await changePartnerTier(partnerId, 'large');
                router.refresh();
              }),
          },
        ]
      : [];

  if (variant === 'bar') {
    return (
      <>
        <div className="mb-4 flex flex-wrap gap-3">
          {approvalStatus === 'pending' ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => execute('approve')}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60">
                ✓ Approve
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => openReasonModal('reject')}
                className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-200 disabled:opacity-60">
                ✗ Reject
              </button>
            </>
          ) : null}

          {approvalStatus === 'approved' ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => openReasonModal('suspend')}
                className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-200 disabled:opacity-60">
                ⏸ Suspend account
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirmDelete}
                className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-100 disabled:opacity-60">
                🗑 Delete
              </button>
            </>
          ) : null}

          {approvalStatus === 'suspended' ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => execute('reactivate')}
                className="rounded-xl bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-200 disabled:opacity-60">
                ✓ Reactivate
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirmDelete}
                className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-100 disabled:opacity-60">
                🗑 Delete
              </button>
            </>
          ) : null}

          {approvalStatus === 'rejected' ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => execute('approve')}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60">
                Re-approve
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirmDelete}
                className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-100 disabled:opacity-60">
                🗑 Delete
              </button>
            </>
          ) : null}

          {approvalStatus === 'deleted' ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => execute('approve')}
              className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60">
              Re-approve account
            </button>
          ) : null}
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <ReasonModal
          open={reasonModal !== null}
          action={reasonModal ?? 'reject'}
          reason={reason}
          pending={pending}
          onReasonChange={setReason}
          onClose={() => setReasonModal(null)}
          onConfirm={() => {
            if (!reasonModal) return;
            execute(reasonModal, reason);
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative flex items-center justify-end gap-2">
        <Link href={`/admin/partners/${partnerId}`} className="text-sm font-medium text-[#D85A30] hover:underline">
          View
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100">
          ⋮
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-8 z-20 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={pending}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-60 ${item.className ?? ''}`}
                onClick={item.onClick}>
                {item.label}
              </button>
            ))}
            {menuItems.length > 0 && subscriptionItems.length > 0 ? (
              <div className="my-1 border-t border-gray-100" />
            ) : null}
            {subscriptionItems.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={pending}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-60"
                onClick={() => {
                  setMenuOpen(false);
                  item.onClick();
                }}>
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}

      <ReasonModal
        open={reasonModal !== null}
        action={reasonModal ?? 'reject'}
        reason={reason}
        pending={pending}
        onReasonChange={setReason}
        onClose={() => setReasonModal(null)}
        onConfirm={() => {
          if (!reasonModal) return;
          execute(reasonModal, reason);
        }}
      />
    </>
  );
}
