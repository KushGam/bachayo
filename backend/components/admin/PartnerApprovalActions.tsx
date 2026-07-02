'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function PartnerApprovalActions({
  partnerId,
  variant = 'full',
}: {
  partnerId: string;
  variant?: 'full' | 'reapprove';
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    const response = await fetch('/api/admin/partners/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ partnerId }),
    });
    const data = (await response.json()) as { success?: boolean; error?: string };
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? 'Could not approve partner');
    }
    router.refresh();
  }

  async function reject() {
    const response = await fetch('/api/admin/partners/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ partnerId, reason }),
    });
    const data = (await response.json()) as { success?: boolean; error?: string };
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? 'Could not reject partner');
    }
    setRejectOpen(false);
    setReason('');
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                await approve();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Approve failed');
              }
            })
          }
          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
          {variant === 'reapprove' ? 'Re-approve' : '✓ Approve'}
        </button>
        {variant === 'full' ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setRejectOpen(true)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
          ✗ Reject
        </button>
        ) : null}
      </div>

      {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}

      {rejectOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Reject partner</h3>
            <p className="mt-2 text-sm text-gray-600">Add a short reason the partner will see in the app.</p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Reason for rejection"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                onClick={() => setRejectOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                onClick={() =>
                  start(async () => {
                    setError(null);
                    try {
                      await reject();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Reject failed');
                    }
                  })
                }>
                Reject partner
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
