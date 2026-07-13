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
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {safeItems.map((item) => {
        const expanded = openId === item.id;
        return (
          <div key={item.id} className="border-b border-[var(--border)] last:border-b-0">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
              aria-expanded={expanded}>
              <span className="font-display text-base font-semibold text-[var(--ink)]">{item.q}</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-lg font-bold text-[var(--primary)]">
                {expanded ? '−' : '+'}
              </span>
            </button>
            <div
              className="overflow-hidden px-6 transition-all duration-400 ease-out"
              style={{ maxHeight: expanded ? 480 : 0, opacity: expanded ? 1 : 0 }}>
              <p className="pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
