'use client';

import { useEffect, useState } from 'react';

import { AnimatedCountUp } from '@/components/AnimatedCountUp';

type ImpactStats = {
  partners: number;
  orders: number;
  foodRescued: number;
};

const FALLBACK: ImpactStats = {
  partners: 0,
  orders: 0,
  foodRescued: 0,
};

export function LiveImpactStats() {
  const [stats, setStats] = useState<ImpactStats>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch('/api/stats', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as Partial<ImpactStats>;
        if (cancelled) return;
        setStats({
          partners: Number(data.partners ?? 0),
          orders: Number(data.orders ?? 0),
          foodRescued: Number(data.foodRescued ?? 0),
        });
      } catch {
        // fall back silently
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { value: 4, suffix: '', label: 'Cities at launch', live: false },
    { value: 70, suffix: '%', label: 'Average savings per bag', live: false },
    {
      value: Math.round(stats.foodRescued),
      suffix: ' kg',
      label: 'Food rescued so far',
      live: true,
    },
    { value: 30, suffix: '', label: 'Free trial for restaurants', live: false },
  ];

  return (
    <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 px-6 md:grid-cols-4 md:gap-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-3xl border border-white/8 p-6 text-center md:p-8">
          <div className="text-4xl font-black text-white md:text-5xl">
            {card.live ? (
              <AnimatedCountUp target={card.value} suffix={card.suffix} />
            ) : (
              <>
                <AnimatedCountUp target={card.value} />
                <span className="text-[#D85A30]">{card.suffix}</span>
              </>
            )}
          </div>
          <div className="mt-3 text-sm text-white/50">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
