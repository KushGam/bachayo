'use client';

import { AnimatedCountUp } from '@/components/AnimatedCountUp';

const STATS = [
  { value: 4, suffix: '', label: 'Cities launching' },
  { value: 70, suffix: '%', label: 'Average savings' },
  { value: 30, suffix: '', label: 'Day free trial' },
] as const;

export function LiveImpactStats() {
  return (
    <div className="mx-auto mt-14 grid max-w-[900px] grid-cols-1 gap-px overflow-hidden rounded-[28px] border border-white/25 bg-white/20 px-0 shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:grid-cols-3">
      {STATS.map((card) => (
        <div key={card.label} className="bg-[#D85A30] px-5 py-9 text-center backdrop-blur-sm md:py-11">
          <div className="font-display text-3xl font-black tracking-tight text-white md:text-4xl">
            <AnimatedCountUp target={card.value} />
            <span className="text-white">{card.suffix}</span>
          </div>
          <div className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-white/80 md:text-[13px]">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
