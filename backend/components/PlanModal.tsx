import Link from 'next/link';

import { PLANS, type Plan } from '@/lib/plans';

type PlanModalProps = {
  /** `stack` = vertical list (home partner column). `grid` = 3-up pricing section. */
  layout?: 'grid' | 'stack';
};

function PlanCard({ plan, layout }: { plan: Plan; layout: 'grid' | 'stack' }) {
  const included = plan.features.filter((f) => f.included).slice(0, layout === 'stack' ? 3 : 4);

  return (
    <Link
      href={`/plans/${plan.id}`}
      className={`group relative block overflow-hidden rounded-[22px] border transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        plan.popular
          ? 'border-[var(--primary)]/70 bg-gradient-to-b from-[#241912] to-[#14110f] shadow-[0_20px_50px_rgba(216,90,48,0.18)]'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
      } ${layout === 'stack' ? 'p-5 sm:p-6' : 'p-6 md:p-7'} hover:-translate-y-0.5`}>
      {plan.popular ? (
        <div className="absolute right-4 top-4 rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          Popular
        </div>
      ) : null}

      <div className={layout === 'stack' ? 'pr-16' : plan.popular ? 'pr-16' : undefined}>
        <p className="font-display text-[15px] font-semibold tracking-wide text-white/90">
          {plan.name}
        </p>
        <p className="mt-2 font-display text-[1.65rem] font-extrabold leading-none tracking-tight text-[var(--primary)] sm:text-[1.85rem]">
          NPR {plan.price.toLocaleString()}
          <span className="ml-1 text-sm font-semibold text-white/35">/mo</span>
        </p>
        <p className="mt-2 text-[12px] font-semibold tracking-wide text-[#7CB89A]">
          First month free · Month 2 half price
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/45">{plan.tagline}</p>
      </div>

      <ul className={`space-y-2.5 ${layout === 'stack' ? 'mt-5' : 'mt-6'}`}>
        {included.map((f) => (
          <li key={f.label} className="flex items-start gap-2.5 text-sm text-white/70">
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[10px] font-bold text-[var(--primary)]"
              aria-hidden>
              ✓
            </span>
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] transition group-hover:gap-2.5">
        See full details
        <span aria-hidden>→</span>
      </p>
    </Link>
  );
}

/** Plan cards — each links to /plans/[id] for full details. */
export function PlanModal({ layout = 'grid' }: PlanModalProps) {
  return (
    <div
      className={
        layout === 'stack'
          ? 'flex flex-col gap-4'
          : 'grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6'
      }>
      {PLANS.map((plan) => (
        <PlanCard key={plan.id} plan={plan} layout={layout} />
      ))}
    </div>
  );
}
