'use client';

import { useMemo, useState } from 'react';

export function FaqAccordion({
  items,
}: {
  items: Array<{ id: string; q: string; a: string }>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const safeItems = useMemo(() => items ?? [], [items]);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
      {safeItems.map((item, idx) => {
        const expanded = openId === item.id;
        return (
          <div key={item.id} className="border-b border-gray-200 last:border-b-0">
            <button
              type="button"
              className="w-full flex justify-between items-center px-6 py-5 text-left"
              onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}>
              <div className="text-[#1A1A1A] font-semibold text-base">{item.q}</div>
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FAECE7] text-[#D85A30] font-bold">
                {expanded ? '−' : '+'}
              </div>
            </button>
            <div
              className="px-6 pb-5 overflow-hidden transition-all duration-500 ease-out"
              style={{ maxHeight: expanded ? 420 : 0, opacity: expanded ? 1 : 0 }}>
              <div className="text-[#6B7280] text-sm leading-relaxed mt-1">{item.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

