'use client';

import { useEffect, useState } from 'react';

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  popular: boolean;
  maxListings: number | null;
  features: {
    label: string;
    included: boolean;
  }[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: 'small',
    name: 'Small',
    tagline: 'Perfect for cafés, dhabas, and home bakeries',
    price: 1000,
    popular: false,
    maxListings: 5,
    features: [
      { label: 'Up to 5 bag listings per day', included: true },
      { label: 'QR code pickup verification', included: true },
      { label: 'Customer order management', included: true },
      { label: 'Email support', included: true },
      { label: 'Sales analytics', included: false },
      { label: 'Priority support', included: false },
      { label: 'Multi-branch support', included: false },
      { label: 'Featured placement', included: false },
    ],
    cta: 'Start free — no card needed',
  },
  {
    id: 'medium',
    name: 'Medium',
    tagline: 'For restaurants, bakeries, and growing cafés',
    price: 1500,
    popular: true,
    maxListings: 15,
    features: [
      { label: 'Up to 15 bag listings per day', included: true },
      { label: 'QR code pickup verification', included: true },
      { label: 'Customer order management', included: true },
      { label: 'Email support', included: true },
      { label: 'Sales analytics dashboard', included: true },
      { label: 'Priority support', included: true },
      { label: 'Multi-branch support', included: false },
      { label: 'Featured placement', included: false },
    ],
    cta: 'Start free — no card needed',
  },
  {
    id: 'large',
    name: 'Large',
    tagline: 'For hotels, marts, and multi-branch businesses',
    price: 3500,
    popular: false,
    maxListings: null,
    features: [
      { label: 'Unlimited bag listings per day', included: true },
      { label: 'QR code pickup verification', included: true },
      { label: 'Customer order management', included: true },
      { label: 'Email support', included: true },
      { label: 'Sales analytics dashboard', included: true },
      { label: 'Priority support', included: true },
      { label: 'Multi-branch support', included: true },
      { label: 'Featured placement in app', included: true },
    ],
    cta: 'Start free — no card needed',
  },
];

export function PlanModal() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!selectedPlan) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPlan(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [selectedPlan]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlan(plan)}
            className={`cursor-pointer rounded-2xl border-2 p-6 text-left transition-all hover:scale-105 hover:shadow-xl ${
              plan.popular
                ? 'border-[#D85A30] bg-[#1A1A1A]'
                : 'border-white/10 bg-[#191919]'
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
          </button>
        ))}
      </div>

      {selectedPlan ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPlan(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-modal-title">
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#1A1A1A] p-8"
            onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="absolute right-4 top-4 text-2xl font-light text-white/40 hover:text-white"
              aria-label="Close">
              ×
            </button>

            {selectedPlan.popular ? (
              <div className="mb-4 inline-block rounded-full bg-[#D85A30] px-3 py-1 text-xs font-bold text-white">
                MOST POPULAR
              </div>
            ) : null}

            <h2 id="plan-modal-title" className="mb-1 text-3xl font-black text-white">
              {selectedPlan.name} Plan
            </h2>
            <p className="mb-6 text-sm text-white/50">{selectedPlan.tagline}</p>

            <div className="mb-6 rounded-2xl bg-white/5 p-6">
              <div className="mb-4 inline-block rounded-full bg-[#D85A30]/20 px-3 py-1 text-xs font-bold text-[#D85A30]">
                🎉 Launch Offer
              </div>

              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Month 1</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/30 line-through">
                      NPR {selectedPlan.price.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-green-400">FREE</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Month 2</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/30 line-through">
                      NPR {selectedPlan.price.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-[#D85A30]">
                      NPR {Math.round(selectedPlan.price * 0.5).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Month 3+</span>
                  <span className="text-sm font-bold text-white">
                    NPR {selectedPlan.price.toLocaleString()}/mo
                  </span>
                </div>
              </div>

              <div className="my-4 border-t border-white/10" />

              <div className="text-center">
                <span className="text-xs text-white/40">You save in first 2 months:</span>
                <span className="ml-2 text-lg font-black text-green-400">
                  NPR {Math.round(selectedPlan.price * 1.5).toLocaleString()}
                </span>
              </div>

              <div className="mt-4 flex justify-center gap-3">
                <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
                  <div className="text-sm font-bold text-white">
                    NPR {Math.round(selectedPlan.price * 3 * 0.95).toLocaleString()}
                  </div>
                  <div className="text-xs text-white/40">3 months (5% off)</div>
                </div>
                <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
                  <div className="text-sm font-bold text-white">
                    NPR {Math.round(selectedPlan.price * 12 * 0.9).toLocaleString()}
                  </div>
                  <div className="text-xs text-white/40">12 months (10% off)</div>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-[#D85A30]/30 bg-[#D85A30]/10 p-4 text-center">
              <div className="text-2xl font-black text-[#D85A30]">
                {selectedPlan.maxListings ?? '∞'}
              </div>
              <div className="mt-1 text-sm text-white/60">bag listings per day</div>
            </div>

            <div className="mb-8 space-y-3">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                What&apos;s included
              </h3>
              {selectedPlan.features.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className={f.included ? 'text-lg text-[#D85A30]' : 'text-lg text-white/20'}>
                    {f.included ? '✓' : '×'}
                  </span>
                  <span
                    className={
                      f.included ? 'text-sm text-white' : 'text-sm text-white/30 line-through'
                    }>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            <a
              href="https://lastbag.app/download"
              className="block w-full rounded-2xl bg-[#D85A30] py-4 text-center text-lg font-bold text-white transition hover:bg-[#C24E28]">
              {selectedPlan.cta}
            </a>

            <p className="mt-4 text-center text-sm text-white/30">
              Questions? WhatsApp us: 9762623241
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
