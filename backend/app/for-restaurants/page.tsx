import Link from 'next/link';

import { ContactTrialCta } from '@/components/ContactTrialCta';
import { FadeIn } from '@/components/FadeIn';
import { FaqAccordion } from '@/components/FaqAccordion';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

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
      a: 'Pick the bag name, what’s inside, set rescue/original prices, choose takeaway or dine-in, set quantity, and publish the pickup window. Your listing goes live immediately.',
    },
    {
      id: 'pickup',
      q: 'How does pickup work for customers?',
      a: 'Customers reserve for free and pick up during the stated window. You confirm pickup in the app (QR or manual) and collect payment directly.',
    },
    {
      id: 'payments',
      q: 'When do I get paid?',
      a: 'You collect payment directly at pickup — cash, eSewa, Khalti, or whatever you accept. LastBag does not process payments and takes no commission.',
    },
    {
      id: 'cancel',
      q: 'What if a customer cancels?',
      a: 'Customers can cancel until 30 minutes before pickup starts. After that, cancellation is blocked so your kitchen can prepare with confidence.',
    },
    {
      id: 'cities',
      q: 'Is LastBag available in my city?',
      a: 'Yes. LastBag is open to partners worldwide. Sign up and start listing — customers near you will see your bags immediately.',
    },
    {
      id: 'subscription',
      q: 'What happens after the trial ends?',
      a: 'Subscriptions renew monthly. If your subscription is paused or past due, new listings are paused until billing is active again.',
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <section className="grain relative overflow-hidden pb-24 pt-32 md:pb-28 md:pt-36">
        <div className="absolute inset-0 bg-[var(--ink)]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 50% at 75% 15%, rgba(216,90,48,0.3), transparent 58%)',
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <FadeIn delay={0}>
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              For restaurants & cafés
            </p>
            <h1
              className="mt-5 font-display font-extrabold leading-[1.05] tracking-tight text-white"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 3.75rem)' }}>
              Turn tonight&apos;s surplus
              <span className="mt-2 block text-white/70">into revenue.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/55">
              List rescue bags in minutes. Reach nearby customers. Keep 100% of every sale — flat
              monthly pricing, zero commission.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <ContactTrialCta className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[var(--primary)] transition hover:bg-[#fff7f3]">
                Start free 30-day trial
              </ContactTrialCta>
              <Link
                href="#how-it-works"
                className="btn-ghost-light text-base">
                See how it works
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How it works — editorial numbered rows */}
      <section id="how-it-works" className="bg-[var(--surface)] py-24 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="section-label">Partner flow</p>
          </div>
          <h2 className="mt-3 text-center font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            Live in three steps
          </h2>

          <div className="mt-16 space-y-0 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {[
              {
                n: '01',
                t: 'Sign up in minutes',
                d: 'Create your partner profile, set your location, and start a free 30-day trial — no card required.',
              },
              {
                n: '02',
                t: 'List your rescue bag',
                d: 'Name the bag, describe what’s inside, set prices and quantity, choose takeaway or dine-in, and publish the pickup window.',
              },
              {
                n: '03',
                t: 'Confirm pickup & collect payment',
                d: 'Customers reserve for free. You get notified, confirm with QR or tap, and collect cash or digital payment at the counter.',
              },
            ].map((step, idx) => (
              <FadeIn key={step.n} delay={idx * 80}>
                <div className="grid gap-4 py-10 sm:grid-cols-[5rem_1fr] sm:gap-8">
                  <p className="font-display text-3xl font-extrabold text-[var(--primary)]">{step.n}</p>
                  <div>
                    <h3 className="font-display text-xl font-bold text-[var(--ink)] md:text-2xl">
                      {step.t}
                    </h3>
                    <p className="mt-2 max-w-xl leading-relaxed text-[var(--text-secondary)]">
                      {step.d}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why partner */}
      <section className="bg-[var(--bg)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            Built for Nepal&apos;s kitchens
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-relaxed text-[var(--text-secondary)]">
            No per-order fees. No complicated setup. Just surplus sold before it becomes waste.
          </p>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                title: 'Keep 100% of sales',
                desc: 'You collect payment at pickup. LastBag charges one flat monthly subscription — nothing per order.',
              },
              {
                title: 'List in minutes',
                desc: 'Add your bag, set quantity and pickup window, and go live. Staff can manage orders from the partner app.',
              },
              {
                title: 'Simple pickup flow',
                desc: 'Reservations, chat, QR confirm, and reviews — designed for busy counters, not desk work.',
              },
            ].map((item) => (
              <div key={item.title}>
                <div className="h-px w-10 bg-[var(--primary)]" />
                <h3 className="mt-5 font-display text-xl font-bold text-[var(--ink)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="bg-[var(--bg)] py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="section-label">Coverage</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            Open for partners worldwide
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
            Sign up from anywhere. Customers near your kitchen see your bags automatically — no
            city lock-in.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[var(--surface)] py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            Pricing that scales with you
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-relaxed text-[var(--text-secondary)]">
            Start with a 30-day free trial. After that, pick the tier that fits your business size.
          </p>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                tier: 'Small',
                price: 'NPR 800',
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
                price: 'NPR 1,800',
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
                price: 'NPR 3,500',
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
                  className={`flex h-full flex-col rounded-3xl border p-8 ${
                    tier.active
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] shadow-lg shadow-[var(--primary)]/10'
                      : 'border-[var(--border)] bg-[var(--bg)]'
                  }`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                    {tier.tier}
                    {tier.active ? ' · Popular' : ''}
                  </p>
                  <p className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[var(--ink)]">
                    {tier.price}
                    <span className="ml-1 text-base font-semibold text-[var(--text-secondary)]">
                      /mo
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">30-day free trial</p>

                  <ul className="mt-8 flex-1 space-y-3">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                        <span className="mt-0.5 font-bold text-[var(--primary)]">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <ContactTrialCta
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-base font-semibold transition ${
                      tier.active
                        ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                        : 'bg-[var(--ink)] text-white hover:bg-[#2a2420]'
                    }`}>
                    Start free trial
                  </ContactTrialCta>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[var(--bg)] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            Partner FAQ
          </h2>
          <div className="mt-12">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--ink)] py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Ready to rescue surplus?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/65">
            Join LastBag and turn end-of-day food into reserved bags customers pick up the same
            evening.
          </p>
          <div className="mx-auto mt-10 max-w-sm space-y-4">
            <ContactTrialCta className="inline-flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-10 py-4 text-lg font-semibold text-white transition hover:bg-[var(--primary-dark)]">
              Start your free trial
            </ContactTrialCta>
            <p className="text-sm text-white/50">Already have an account?</p>
            <GoogleSignInButton />
          </div>
        </div>
      </section>
    </main>
  );
}
