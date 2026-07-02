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
        // fall back to defaults silently
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="text-center">
        <div className="text-5xl font-bold text-white">
          <AnimatedCountUp target={stats.partners} suffix="+" />
        </div>
        <div className="text-white/70 text-sm mt-2 font-medium">Restaurants onboarded</div>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold text-white">70%</div>
        <div className="text-white/70 text-sm mt-2 font-medium">Average savings per bag</div>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold text-white">
          <AnimatedCountUp target={stats.orders} />
        </div>
        <div className="text-white/70 text-sm mt-2 font-medium">Orders fulfilled</div>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold text-white">
          <AnimatedCountUp target={Math.round(stats.foodRescued)} suffix=" kg" />
        </div>
        <div className="text-white/70 text-sm mt-2 font-medium">Food rescued so far</div>
      </div>
    </div>
  );
}

