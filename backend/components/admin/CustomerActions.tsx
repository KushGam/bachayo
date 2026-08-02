'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

async function runCustomerAction(profileId: string, action: 'suspend' | 'delete') {
  const response = await fetch('/api/admin/customers/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ profileId, action }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };
  if (!response.ok || !data.success) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
}

export function CustomerActions({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href={`/admin/customers/${profileId}`}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
          View
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm('Suspend this customer?')) return;
            start(async () => {
              setError(null);
              try {
                await runCustomerAction(profileId, 'suspend');
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Suspend failed');
              }
            });
          }}
          className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-60">
          Suspend
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm('Delete customer permanently?')) return;
            start(async () => {
              setError(null);
              try {
                await runCustomerAction(profileId, 'delete');
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Delete failed');
              }
            });
          }}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">
          {pending ? '…' : 'Delete'}
        </button>
      </div>
      {error ? <p className="max-w-xs text-right text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
