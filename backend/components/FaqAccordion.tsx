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
    <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      {safeItems.map((item) => {
        const expanded = openId === item.id;
        return (
          <div key={item.id} className="border-b border-[var(--border)] last:border-b-0">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-[var(--bg)]/70"
              onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
              aria-expanded={expanded}>
              <span className="font-display text-[15px] font-semibold text-[var(--ink)] md:text-base">
                {item.q}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-medium transition duration-300 ${
                  expanded
                    ? 'bg-[var(--primary)] text-white shadow-[0_8px_20px_rgba(216,90,48,0.3)]'
                    : 'bg-[var(--primary-light)] text-[var(--primary)]'
                }`}>
                {expanded ? '−' : '+'}
              </span>
            </button>
            <div
              className="overflow-hidden px-6 transition-all duration-300 ease-out"
              style={{ maxHeight: expanded ? 480 : 0, opacity: expanded ? 1 : 0 }}>
              <p className="pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
