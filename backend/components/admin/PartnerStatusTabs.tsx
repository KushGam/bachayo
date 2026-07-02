'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function PartnerStatusTabs({
  pendingCount,
  suspendedCount,
}: {
  pendingCount: number;
  suspendedCount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get('approval') ?? 'all';

  const tabs = [
    { id: 'all', label: 'All', highlight: false },
    {
      id: 'pending',
      label: pendingCount > 0 ? `Pending (${pendingCount})` : 'Pending',
      highlight: pendingCount > 0,
      highlightClass: 'border-red-200 text-red-700',
    },
    { id: 'approved', label: 'Approved', highlight: false },
    {
      id: 'suspended',
      label: suspendedCount > 0 ? `Suspended (${suspendedCount})` : 'Suspended',
      highlight: suspendedCount > 0,
      highlightClass: 'border-amber-200 text-amber-700',
    },
    { id: 'rejected', label: 'Rejected', highlight: false },
  ] as const;

  function setTab(approval: string) {
    const next = new URLSearchParams(params.toString());
    if (approval === 'all') next.delete('approval');
    else next.set('approval', approval);
    next.delete('page');
    router.push(`/admin/partners?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = current === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={[
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              active
                ? 'bg-[#D85A30] text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              tab.highlight && !active ? tab.highlightClass : '',
            ].join(' ')}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
