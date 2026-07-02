'use client';

import { useTransition } from 'react';

import { removeReview } from '@/app/admin/actions';

export function ReviewRemoveButton({ reviewId }: { reviewId: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm('Remove this review permanently?')) start(() => removeReview(reviewId));
      }}
      className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">
      Remove
    </button>
  );
}
