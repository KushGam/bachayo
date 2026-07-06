import Link from 'next/link';

import { ContactTrialCta } from '@/components/ContactTrialCta';
import { FadeIn } from '@/components/FadeIn';
import { FaqAccordion } from '@/components/FaqAccordion';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

function LogoMark({ variant }: { variant: 'light' | 'dark' }) {
  return (
    <span
      className={`inline-flex items-center text-2xl font-extrabold tracking-tight ${
        variant === 'light' ? 'text-white' : 'text-[#D85A30]'
      }`}>
      LastBag
    </span>
  );
}

export default function ForRestaurantsPage() {
  const faqItems = [
    {
      id: 'signup',
      q: 'How do I join LastBag as a partner?',
      a: 'Sign up for a free 30-day trial. We’ll help you list your first rescue bag in minutes — no payment required to get started.',
    },
    {
      id: 'list',
      q: 'How do I list a rescue bag?',
      a: 'Pick the bag name, what’s inside, set rescue/original prices, choose quantity, and publish the pickup window. Your listing goes live immediately.',
    },
    {
      id: 'pickup',
      q: 'How does pickup work for customers?',
      a: 'Customers reserve for free and then pick up during the stated window. You confirm pickup on the app and collect the agreed payment directly.',
    },
    {
      id: 'payments',
      q: 'When do I get paid?',
      a: 'You collect payment directly at pickup — cash, eSewa, Khalti, or whatever you accept. LastBag does not process payments.',
    },
    {
      id: 'subscription',
      q: 'What happens after the trial ends?',
      a: 'Subscriptions renew monthly. If your subscription is paused or past due, new listings are paused until billing is active again.',
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#065F46] via-[#D85A30] to-[#993C1D]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_60%,white,transparent_50%)]" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid gap-10 items-center lg:grid-cols-2">
            <FadeIn delay={0}>
              <div className="bg-white/10 rounded-3xl border border-white/20 p-8">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold rounded-full px-3 py-1">
                  🏪 Restaurant owners
                </div>
                <h1 className="mt-4 text-5xl md:text-6xl font-bold text-white leading-tight">
                  Turn tonight&apos;s surplus into revenue
                </h1>
                <p className="mt-6 text-xl text-white/80">
                  List surplus food, reach nearby customers, and keep every rupee you earn.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <ContactTrialCta className="inline-flex items-center justify-center rounded-full bg-[#D85A30] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#993C1D]">
                    Start your free 30-day trial →
                  </ContactTrialCta>
                  <Link
                    href="/for-restaurants#how-it-works"
                    className="inline-flex items-center justify-center border border-white/30 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition">
                    See how it works
                  </Link>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={140}>
              <div className="rounded-3xl border border-white/20 bg-white/10 p-8">
                <div className="flex items-center gap-3">
                  <LogoMark variant="light" />
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { e: '📝', t: 'Sign up in 5 minutes' },
                    { e: '🛍', t: 'List your rescue bag daily' },
                    { e: '💰', t: 'Customers reserve, pick up, and pay you' },
                  ].map((s, idx) => (
                    <div key={s.t} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-2xl">
                        {s.e}
                      </div>
                      <div className="text-white text-base font-semibold">
                        {s.t}
                        {idx === 0 ? <div className="text-white/70 text-sm mt-1">No card required for trial</div> : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-white/70 text-sm">
                  Reduce waste. Reach nearby customers. Make surplus food a win-win.
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#F5F3EF] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-[#D85A30] font-semibold text-sm uppercase tracking-widest text-center">
            How it works for restaurants
          </div>
          <h2 className="text-4xl font-bold text-center text-[#1A1A1A] mt-3">
            How LastBag works for restaurants
          </h2>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '1', e: '📝', t: 'Sign up in 5 minutes', d: 'Create your partner profile and choose your subscription tier.' },
              { n: '2', e: '🛍', t: 'List your rescue bag daily', d: 'Add the bag details, set quantity, and publish your pickup window.' },
              { n: '3', e: '💰', t: 'Customers reserve, pick up, and pay you', d: 'Confirm pickup and collect payment directly at pickup.' },
            ].map((s, idx) => (
              <FadeIn key={s.n} delay={idx * 120}>
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FAECE7] text-[#D85A30] font-bold text-xl flex items-center justify-center mx-auto">
                    {s.n}
                  </div>
                  <div className="text-5xl mt-6">{s.e}</div>
                  <div className="text-xl font-bold mt-4 text-[#1A1A1A]">{s.t}</div>
                  <p className="text-[#6B7280] mt-3 leading-relaxed text-sm">{s.d}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center">Pricing that scales with you</h2>
          <p className="text-[#6B7280] text-lg mt-4 text-center max-w-2xl mx-auto">
            Start with a 30-day free trial. After that, pick the tier that fits your business size.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                tier: 'Small',
                price: 'NPR 800/mo',
                active: false,
                features: [
                  'List daily rescue bags',
                  'Customer pickup confirmations',
                  'Basic review visibility',
                  'Email support',
                  'Waste reduction insights',
                ],
              },
              {
                tier: 'Medium',
                price: 'NPR 1,800/mo',
                active: true,
                features: [
                  'Everything in Small',
                  'Priority listing visibility',
                  'Expanded weekly reporting',
                  'Faster support responses',
                  'Review highlights & tips',
                ],
              },
              {
                tier: 'Large',
                price: 'NPR 3,500/mo',
                active: false,
                features: [
                  'Everything in Medium',
                  'Multi-day listing options',
                  'Advanced performance tracking',
                  'Community promotions',
                  'Dedicated partner onboarding',
                ],
              },
            ].map((tier) => (
              <FadeIn key={tier.tier}>
                <div
                  className={`rounded-3xl border p-8 ${
                    tier.active
                      ? 'border-[#D85A30] bg-[#FAECE7]'
                      : 'border-gray-200 bg-[#F5F3EF]'
                  }`}>
                  <div className="text-sm font-semibold text-[#D85A30] uppercase tracking-widest">
                    {tier.tier}
                  </div>
                  <div className="mt-4 text-4xl font-bold text-[#1A1A1A]">{tier.price}</div>
                  <div className="mt-2 text-sm text-[#6B7280]">30-day free trial</div>

                  <ul className="mt-6 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[#4B5563] text-sm">
                        <span className="mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <ContactTrialCta
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-base font-bold transition ${
                      tier.active
                        ? 'bg-[#D85A30] text-white hover:bg-[#993C1D]'
                        : 'bg-[#1A1A1A] text-white hover:bg-[#374151]'
                    }`}>
                    Start free trial →
                  </ContactTrialCta>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* WHY PARTNER */}
      <section className="bg-[#F5F3EF] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center">Why partner with LastBag</h2>
          <p className="mt-4 text-[#6B7280] text-center max-w-2xl mx-auto">
            A straightforward platform built for Nepal&apos;s restaurants — no per-order commissions,
            no complicated setup.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '💰',
                title: 'Keep 100% of sales',
                desc: 'You collect payment directly at pickup. LastBag charges one flat monthly subscription — nothing per order.',
              },
              {
                icon: '⚡',
                title: 'List in minutes',
                desc: 'Add your rescue bag, set quantity and pickup window, and go live. No lengthy onboarding process.',
              },
              {
                icon: '📱',
                title: 'Simple pickup flow',
                desc: 'Customers reserve in the app. You confirm with a QR scan or manual mark. Staff-friendly and fast.',
              },
            ].map((item) => (
              <FadeIn key={item.title}>
                <div className="bg-white rounded-3xl p-8 border border-gray-100">
                  <div className="text-4xl">{item.icon}</div>
                  <h3 className="mt-4 text-lg font-bold text-[#1A1A1A]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* RESTAURANT FAQ */}
      <section id="faq" className="bg-white py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center">Restaurant FAQ</h2>
          <div className="mt-12">
            <FaqAccordion items={faqItems.map((x) => ({ id: x.id, q: x.q, a: x.a }))} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1A1A1A] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs rounded-full px-3 py-1">
            🥗 Reduce waste, earn more
          </div>
          <h2 className="text-4xl font-bold text-white mt-4">Ready to reduce waste and earn more?</h2>
          <p className="text-white/70 text-lg mt-4 max-w-2xl mx-auto">
            Join LastBag and turn surplus food into rescue bags customers reserve for free.
          </p>
          <div className="mt-10 mx-auto max-w-sm">
            <ContactTrialCta className="inline-flex w-full items-center justify-center rounded-full bg-[#D85A30] px-10 py-4 text-lg font-bold text-white transition hover:bg-[#993C1D]">
              Start your free trial →
            </ContactTrialCta>
            <p className="my-4 text-center text-sm text-white/60">Already have an account?</p>
            <GoogleSignInButton />
          </div>
        </div>
      </section>
    </main>
  );
}

