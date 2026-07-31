import Link from 'next/link';

import { PLANS } from '@/lib/plans';

/** Plan cards grid — each card links to /plans/[id] for full details. */
export function PlanModal() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PLANS.map((plan) => (
        <Link
          key={plan.id}
          href={`/plans/${plan.id}`}
          className={`cursor-pointer rounded-2xl border-2 p-6 text-left transition-all hover:scale-105 hover:shadow-xl ${
            plan.popular ? 'border-[#D85A30] bg-[#1A1A1A]' : 'border-white/10 bg-[#191919]'
          }`}>
          {plan.popular ? (
            <div className="mb-3 inline-block rounded-full bg-[#D85A30] px-3 py-1 text-xs font-bold text-white">
              POPULAR
            </div>
          ) : null}

          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
            <div className="text-right">
              <div>
                <span className="text-xl font-black text-[#D85A30]">
                  NPR {plan.price.toLocaleString()}
                </span>
                <span className="text-sm text-white/40">/mo</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-green-400">
                First month FREE · Month 2 half price
              </div>
            </div>
          </div>

          <p className="mb-4 text-sm text-white/50">{plan.tagline}</p>

          <div className="space-y-2">
            {plan.features
              .filter((f) => f.included)
              .slice(0, 3)
              .map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#D85A30]">✓</span>
                  {f.label}
                </div>
              ))}
          </div>

          <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#D85A30]">
            See full details →
          </div>
        </Link>
      ))}
    </div>
  );
}
