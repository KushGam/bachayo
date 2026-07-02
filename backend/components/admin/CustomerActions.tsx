'use client';

import Link from 'next/link';
import { useTransition } from 'react';

import { deleteCustomer, suspendCustomer } from '@/app/admin/actions';

export function CustomerActions({ profileId }: { profileId: string }) {
  const [pending, start] = useTransition();

  return (
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
          if (confirm('Suspend this customer?')) start(() => suspendCustomer(profileId));
        }}
        className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50">
        Suspend
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm('Delete customer permanently?')) start(() => deleteCustomer(profileId));
        }}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
        Delete
      </button>
    </div>
  );
}
