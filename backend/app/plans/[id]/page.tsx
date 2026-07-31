import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getPlan, PLAN_IDS } from '@/lib/plans';

type PlanPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return PLAN_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PlanPageProps): Promise<Metadata> {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) return { title: 'Plan' };

  return {
    title: `${plan.name} Plan`,
    description: `${plan.name} plan — NPR ${plan.price.toLocaleString()}/mo. ${plan.tagline}`,
  };
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) notFound();

  return (
    <main className="min-h-screen bg-[var(--ink)]">
      <section className="mx-auto max-w-lg px-6 pb-24 pt-28 md:pt-32">
        <Link
          href="/for-restaurants#pricing"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/50 transition hover:text-white">
          ← Back to plans
        </Link>

        {plan.popular ? (
          <div className="mb-4 inline-block rounded-full bg-[#D85A30] px-3 py-1 text-xs font-bold text-white">
            MOST POPULAR
          </div>
        ) : null}

        <h1 className="mb-1 text-3xl font-black text-white md:text-4xl">{plan.name} Plan</h1>
        <p className="mb-8 text-sm text-white/50 md:text-base">{plan.tagline}</p>

        <div className="mb-6 rounded-2xl bg-white/5 p-6">
          <div className="mb-4 inline-block rounded-full bg-[#D85A30]/20 px-3 py-1 text-xs font-bold text-[#D85A30]">
            🎉 Launch Offer
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Month 1</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/30 line-through">
                  NPR {plan.price.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-green-400">FREE</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Month 2</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/30 line-through">
                  NPR {plan.price.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-[#D85A30]">
                  NPR {Math.round(plan.price * 0.5).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Month 3+</span>
              <span className="text-sm font-bold text-white">
                NPR {plan.price.toLocaleString()}/mo
              </span>
            </div>
          </div>

          <div className="my-4 border-t border-white/10" />

          <div className="text-center">
            <span className="text-xs text-white/40">You save in first 2 months:</span>
            <span className="ml-2 text-lg font-black text-green-400">
              NPR {Math.round(plan.price * 1.5).toLocaleString()}
            </span>
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
              <div className="text-sm font-bold text-white">
                NPR {Math.round(plan.price * 3 * 0.95).toLocaleString()}
              </div>
              <div className="text-xs text-white/40">3 months (5% off)</div>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
              <div className="text-sm font-bold text-white">
                NPR {Math.round(plan.price * 12 * 0.9).toLocaleString()}
              </div>
              <div className="text-xs text-white/40">12 months (10% off)</div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-[#D85A30]/30 bg-[#D85A30]/10 p-4 text-center">
          <div className="text-2xl font-black text-[#D85A30]">{plan.maxListings ?? '∞'}</div>
          <div className="mt-1 text-sm text-white/60">bag listings per day</div>
        </div>

        <div className="mb-8 space-y-3">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
            What&apos;s included
          </h2>
          {plan.features.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className={f.included ? 'text-lg text-[#D85A30]' : 'text-lg text-white/20'}>
                {f.included ? '✓' : '×'}
              </span>
              <span
                className={f.included ? 'text-sm text-white' : 'text-sm text-white/30 line-through'}>
                {f.label}
              </span>
            </div>
          ))}
        </div>

        <a
          href="https://lastbag.app/download"
          className="block w-full rounded-2xl bg-[#D85A30] py-4 text-center text-lg font-bold text-white transition hover:bg-[#C24E28]">
          {plan.cta}
        </a>

        <p className="mt-4 text-center text-sm text-white/30">
          Questions? WhatsApp us: 9762623241
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {PLAN_IDS.filter((planId) => planId !== plan.id).map((planId) => {
            const other = getPlan(planId);
            if (!other) return null;
            return (
              <Link
                key={planId}
                href={`/plans/${planId}`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/60 transition hover:border-white/25 hover:text-white">
                {other.name} Plan →
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
