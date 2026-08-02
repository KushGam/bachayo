'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function ReviewRemoveButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm('Remove this review permanently?')) return;
          start(async () => {
            setError(null);
            try {
              const response = await fetch('/api/admin/reviews/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ reviewId }),
              });
              const data = (await response.json().catch(() => ({}))) as {
                success?: boolean;
                error?: string;
              };
              if (!response.ok || !data.success) {
                throw new Error(data.error ?? `Request failed (${response.status})`);
              }
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Remove failed');
            }
          });
        }}
        className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">
        {pending ? '…' : 'Remove'}
      </button>
      {error ? <p className="max-w-[10rem] text-right text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
