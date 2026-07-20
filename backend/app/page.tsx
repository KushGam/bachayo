import Link from 'next/link';

import { ContactTrialCta } from '@/components/ContactTrialCta';
import { FadeIn } from '@/components/FadeIn';
import { FaqAccordion } from '@/components/FaqAccordion';
import { LiveImpactStats } from '@/components/LiveImpactStats';

const TICKER_ITEMS = [
  '🍛 Thakali Kitchen · Thamel',
  '☕ Java Coffee · Lazimpat',
  '🥐 Himalayan Bakery · Patan',
  '🏨 Hotel Yak & Yeti · Durbarmarg',
  '🛒 Bhat-Bhateni · Maharajgunj',
  '🍛 Bhojan Griha · Dillibazar',
  '☕ Roadhouse Cafe · Thamel',
  '🥐 Bakery Cafe · Durbar Marg',
];

function QrPlaceholder() {
  return (
    <svg viewBox="0 0 120 120" className="mx-auto mt-8 h-28 w-28" aria-hidden>
      <rect width="120" height="120" fill="white" rx="8" />
      <rect x="10" y="10" width="36" height="36" fill="#0F0F0F" />
      <rect x="16" y="16" width="24" height="24" fill="white" />
      <rect x="22" y="22" width="12" height="12" fill="#0F0F0F" />
      <rect x="74" y="10" width="36" height="36" fill="#0F0F0F" />
      <rect x="80" y="16" width="24" height="24" fill="white" />
      <rect x="86" y="22" width="12" height="12" fill="#0F0F0F" />
      <rect x="10" y="74" width="36" height="36" fill="#0F0F0F" />
      <rect x="16" y="80" width="24" height="24" fill="white" />
      <rect x="22" y="86" width="12" height="12" fill="#0F0F0F" />
      <rect x="56" y="10" width="8" height="8" fill="#0F0F0F" />
      <rect x="56" y="26" width="8" height="8" fill="#0F0F0F" />
      <rect x="56" y="42" width="8" height="8" fill="#0F0F0F" />
      <rect x="72" y="56" width="8" height="8" fill="#0F0F0F" />
      <rect x="88" y="56" width="8" height="8" fill="#0F0F0F" />
      <rect x="104" y="56" width="8" height="8" fill="#0F0F0F" />
      <rect x="56" y="72" width="8" height="8" fill="#0F0F0F" />
      <rect x="72" y="72" width="16" height="16" fill="#0F0F0F" />
      <rect x="96" y="72" width="16" height="16" fill="#0F0F0F" />
      <rect x="56" y="96" width="24" height="8" fill="#0F0F0F" />
      <rect x="88" y="96" width="24" height="16" fill="#0F0F0F" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.8-1.5 0-2.8.9-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.3 2.8 2.2 1.1-.1 1.5-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-.9 2.7-2 .9-1.2 1.2-2.4 1.2-2.5-.1 0-2.2-.9-2.2-3.6zM14.5 5.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24" fill="none" aria-hidden>
      <path d="M1 2.5v19L14.5 12 1 2.5z" fill="#EA4335" />
      <path d="M14.5 12L1 21.5l16.5-3.2L14.5 12z" fill="#FBBC04" />
      <path d="M1 2.5L14.5 12l3-6.3L1 2.5z" fill="#4285F4" />
      <path d="M17.5 5.7L14.5 12l3 6.3L21 12l-3.5-6.3z" fill="#34A853" />
    </svg>
  );
}

export default function HomeLanding() {
  const faqItems = [
    {
      id: 'bag',
      q: 'What is a rescue bag?',
      a: "A rescue bag is a discounted bag of surplus food from a restaurant, cafe, bakery or mart that would otherwise go to waste. You don't know exactly what's inside — that's part of what makes it fun and affordable!",
    },
    {
      id: 'save',
      q: 'How much do I save?',
      a: 'Typically 50–70% off the original price. A meal that normally costs ₨500 might be available as a rescue bag for just ₨150.',
    },
    {
      id: 'pay',
      q: 'Do I pay in the app?',
      a: 'No — LastBag is completely free to use. Reserve your bag for free and pay at the counter when you pick it up. Cash, eSewa, or Khalti — whatever the restaurant accepts.',
    },
    {
      id: 'dinein',
      q: 'Can I dine-in instead of takeaway?',
      a: 'Yes! Many restaurants on LastBag offer both dine-in and takeaway options. You choose when you reserve your bag.',
    },
    {
      id: 'cancel',
      q: 'Can I cancel a reservation?',
      a: 'Yes, you can cancel for free up to 1 hour before the pickup window starts.',
    },
    {
      id: 'city',
      q: 'Is LastBag available in my city?',
      a: "We're launching in Kathmandu first, with Lalitpur, Pokhara, and Bharatpur following soon after. More cities coming!",
    },
    {
      id: 'partner',
      q: 'I run a restaurant. How do I join?',
      a: 'Call us on 0405 290 710 or click "For restaurants" above. We\'ll set you up with a free 30-day trial same day.',
    },
    {
      id: 'pickup',
      q: 'How does pickup verification work?',
      a: 'Three ways — restaurant scans your QR code, you show a 6-digit code, or the restaurant marks it manually. Simple!',
    },
  ];

  return (
    <main className="min-h-screen bg-[#F5F3EF]">
      {/* HERO */}
      <section className="grain relative flex min-h-screen items-center overflow-hidden bg-[#0F0F0F] pt-[68px]">
        <div
          className="pointer-events-none absolute -right-[200px] -top-[100px] h-[700px] w-[700px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(216,90,48,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 py-16 lg:grid-cols-2 lg:py-20">
          <FadeIn>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-medium text-white/70">
                🇳🇵 Nepal&apos;s first food rescue app
              </span>

              <h1
                className="mt-6 font-black leading-[0.95] text-white"
                style={{
                  fontSize: 'clamp(40px, 8vw, 80px)',
                  letterSpacing: '-3px',
                }}>
                Rescue great
                <br />
                food.
                <br />
                Save up to
                <br />
                <span className="text-[#D85A30]">70%.</span>
              </h1>

              <p className="mt-8 max-w-md text-xl leading-relaxed text-white/60">
                Find surplus rescue bags from restaurants, cafes and bakeries near you — at a
                fraction of the price. Good for your wallet, great for Nepal.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#download"
                  className="rounded-2xl bg-[#D85A30] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#D85A30]/30 transition hover:bg-[#993C1D]">
                  Download the app →
                </a>
                <ContactTrialCta className="rounded-2xl border border-white/15 bg-white/8 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/12">
                  I run a restaurant
                </ContactTrialCta>
              </div>

              <div className="mt-14 flex flex-wrap items-center gap-8 border-t border-white/8 pt-8">
                {[
                  { n: '4', l: 'Cities launching' },
                  { n: '70%', l: 'Average savings' },
                  { n: 'Free', l: 'To reserve' },
                ].map((stat, i) => (
                  <div
                    key={stat.l}
                    className={`pr-8 ${i < 2 ? 'border-r border-white/8' : ''}`}>
                    <div className="text-3xl font-black text-white">{stat.n}</div>
                    <div className="mt-1 text-sm text-white/50">{stat.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Phone mockup */}
          <FadeIn delay={120}>
            <div className="relative mx-auto hidden w-[320px] lg:block">
              <div className="animate-float relative mx-auto h-[600px] w-[300px] overflow-hidden rounded-[48px] border-2 border-white/10 bg-[#1A1A1A] shadow-2xl shadow-black/50">
                <div className="mx-auto h-7 w-28 rounded-b-2xl bg-[#0F0F0F]" />

                <div className="bg-[#D85A30] px-5 pb-8 pt-3">
                  <div className="text-sm font-bold text-white">Good evening 🌙</div>
                  <div className="mt-1 text-xs text-white/65">Thamel, Kathmandu</div>
                </div>

                <div className="bg-[#F5F3EF] px-4 py-4">
                  <div className="mb-3 rounded-xl bg-white px-3 py-2.5 text-xs text-[#9CA3AF]">
                    Search restaurants, bakeries...
                  </div>

                  <div className="mb-4 flex gap-2">
                    {['🍛 All', '☕ Cafe', '🥐 Bakery'].map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#D85A30] shadow-sm">
                        {c}
                      </span>
                    ))}
                  </div>

                  {[
                    {
                      emoji: '🍛',
                      partner: 'Thakali Kitchen',
                      title: 'Dal Bhat Set',
                      price: '₨ 150',
                      was: '₨ 500',
                    },
                    {
                      emoji: '🥐',
                      partner: 'Himalayan Bakery',
                      title: 'Bakery Mix',
                      price: '₨ 200',
                      was: '₨ 600',
                    },
                  ].map((bag) => (
                    <div
                      key={bag.title}
                      className="mb-2.5 flex items-start gap-3 rounded-2xl bg-white p-3">
                      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#FAECE7] text-2xl">
                        {bag.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-[#9CA3AF]">{bag.partner}</div>
                        <div className="mt-0.5 text-sm font-bold text-[#1A1A1A]">{bag.title}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-[#D85A30]">{bag.price}</span>
                            <span className="text-[10px] text-[#9CA3AF] line-through">{bag.was}</span>
                          </div>
                          <span className="rounded-full bg-[#D85A30] px-2.5 py-1 text-[10px] font-bold text-white">
                            Reserve
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -right-6 -top-3 w-52 rotate-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#D85A30]" />
                  <span className="text-xs font-bold text-[#D85A30]">New bag nearby!</span>
                </div>
                <div className="mt-1 text-sm font-bold text-[#1A1A1A]">
                  Thakali Kitchen · ₨150
                </div>
              </div>

              <div className="absolute -bottom-3 -left-8 w-48 -rotate-2 rounded-2xl bg-[#10B981] p-3 shadow-xl">
                <div className="text-xs font-bold text-white">✓ Reservation confirmed!</div>
                <div className="mt-1 text-xs text-white/80">Pick up tonight 7–9pm 🎉</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* TICKER */}
      <section className="border-y border-[#F0EDE8] bg-white">
        <p className="pb-2 pt-4 text-center text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
          Restaurants joining LastBag
        </p>
        <div className="overflow-hidden pb-4">
          <div className="marquee-track inline-flex min-w-[200%] gap-12">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="inline-flex items-center whitespace-nowrap text-sm font-medium text-[#6B7280]">
                {item}
                <span className="mx-3 text-lg text-[#D85A30]">·</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#F5F3EF] py-16 md:py-32">
        <FadeIn>
          <p className="text-center text-sm font-bold uppercase tracking-widest text-[#D85A30]">
            How it works
          </p>
          <h2
            className="mt-4 text-center font-black tracking-tight text-[#1A1A1A]"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>
            Rescue food in 3 steps
          </h2>
          <p className="mx-auto mt-4 mb-16 max-w-xl px-6 text-center text-xl text-[#6B7280]">
            No upfront payment. No complicated checkout. Just reserve, arrive, and enjoy.
          </p>
        </FadeIn>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
          {[
            {
              n: '1',
              icon: '🔍',
              bg: 'bg-[#FEF3C7]',
              title: 'Browse nearby',
              desc: 'Find rescue bags from restaurants, cafes, bakeries and hotels near you',
            },
            {
              n: '2',
              icon: '📱',
              bg: 'bg-[#EFF6FF]',
              title: 'Reserve for free',
              desc: 'Reserve your bag in seconds with just your name and email. No upfront payment.',
            },
            {
              n: '3',
              icon: '🛍',
              bg: 'bg-[#ECFDF5]',
              title: 'Pick up & enjoy',
              desc: 'Head to the restaurant during the pickup window. Pay at the counter and enjoy!',
            },
          ].map((step, i) => (
            <FadeIn key={step.n} delay={(i + 1) * 100}>
              <div className="relative overflow-hidden rounded-3xl border border-[#F0EDE8] bg-white p-10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5">
                <span className="pointer-events-none absolute -top-2.5 right-2.5 text-[120px] font-black leading-none text-[rgba(216,90,48,0.05)]">
                  {step.n}
                </span>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#D85A30] text-lg font-black text-white">
                  {step.n}
                </div>
                <div
                  className={`mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl ${step.bg}`}>
                  {step.icon}
                </div>
                <h3 className="mt-6 text-xl font-bold text-[#1A1A1A]">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* BENTO FEATURES */}
      <section id="features" className="bg-white py-16 md:py-32">
        <FadeIn>
          <p className="text-center text-sm font-bold uppercase tracking-widest text-[#D85A30]">
            Features
          </p>
          <h2
            className="mt-4 text-center font-black tracking-tight text-[#1A1A1A]"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>
            Everything you need
          </h2>
          <p className="mx-auto mt-4 max-w-xl px-6 text-center text-xl text-[#6B7280]">
            Built specifically for Nepal&apos;s food scene
          </p>
        </FadeIn>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-4 px-6 md:grid-cols-3">
          <FadeIn delay={100}>
            <div className="relative min-h-[280px] overflow-hidden rounded-3xl bg-[#FAECE7] p-10 md:col-span-2">
              <h3 className="text-2xl font-bold text-[#1A1A1A]">Reserve in seconds</h3>
              <p className="mt-2 max-w-xs text-sm text-[#6B7280]">
                No account needed to browse. Reserve with just your name and email — free.
              </p>
              <div className="absolute bottom-6 right-6 hidden w-56 rotate-3 rounded-2xl border border-[#F0EDE8] bg-white p-4 shadow-xl sm:block">
                <div className="mb-2 h-8 rounded-lg bg-[#F5F3EF]" />
                <div className="mb-3 h-8 rounded-lg bg-[#F5F3EF]" />
                <div className="rounded-lg bg-[#D85A30] py-2 text-center text-xs font-bold text-white">
                  Confirm reservation →
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="min-h-[280px] rounded-3xl bg-[#0F0F0F] p-10">
              <h3 className="text-2xl font-bold text-white">QR pickup</h3>
              <p className="mt-2 text-sm text-white/50">Show QR, pay at counter, done.</p>
              <QrPlaceholder />
              <p className="mt-3 text-center font-mono text-sm tracking-widest text-white/30">
                Order #A3F2
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="min-h-[280px] rounded-3xl bg-[#F5F3EF] p-10">
              <h3 className="text-2xl font-bold text-[#1A1A1A]">Live notifications</h3>
              <p className="mt-2 text-sm text-[#6B7280]">
                Partners notified instantly when someone reserves their bag.
              </p>
              <div className="mt-8 space-y-2">
                {[
                  '🛍 New reservation · Kushal',
                  '⭐ New review · 5 stars',
                  '⏰ Pickup reminder sent',
                ].map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-2 rounded-xl border border-[#F0EDE8] bg-white p-3 shadow-sm">
                    <span className="text-xs font-semibold text-[#1A1A1A]">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="relative min-h-[280px] overflow-hidden rounded-3xl bg-[#D85A30] p-10 md:col-span-2">
              <span className="pointer-events-none absolute bottom-2 right-6 text-[120px] font-black leading-none text-white/10">
                100%
              </span>
              <h3 className="text-2xl font-bold text-white">Zero commission</h3>
              <p className="mt-2 max-w-xs text-sm text-white/70">
                Keep 100% of every sale. Pay one flat monthly fee — nothing more.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {['✓ No per-sale commission', '✓ 30-day free trial', '✓ Cancel anytime'].map(
                  (p) => (
                    <span
                      key={p}
                      className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white">
                      {p}
                    </span>
                  ),
                )}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="min-h-[280px] rounded-3xl bg-[#F5F3EF] p-10">
              <h3 className="text-2xl font-bold text-[#1A1A1A]">Dine-in or takeaway</h3>
              <p className="mt-2 text-sm text-[#6B7280]">
                Partners set the option. Customers choose when reserving — perfect for Nepal.
              </p>
              <div className="mt-8 space-y-3">
                <div className="rounded-xl border border-[#F0EDE8] bg-white p-3 text-sm font-semibold shadow-sm">
                  🛍 Takeaway · ₨150
                </div>
                <div className="rounded-xl border-2 border-[#D85A30] bg-[#FAECE7] p-3 text-sm font-semibold text-[#D85A30]">
                  🪑 Dine-in · ₨200
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* IMPACT */}
      <section id="impact" className="bg-[#0F0F0F] py-16 md:py-24">
        <FadeIn>
          <h2
            className="text-center font-black tracking-tight text-white"
            style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Every bag rescued matters
          </h2>
          <p className="mt-4 text-center text-[#6B7280]">
            Real impact, one rescue bag at a time
          </p>
        </FadeIn>
        <LiveImpactStats />
      </section>

      {/* CATEGORIES */}
      <section className="bg-[#F5F3EF] py-16 md:py-24">
        <FadeIn>
          <h2
            className="text-center font-black tracking-tight text-[#1A1A1A]"
            style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Every type of business
          </h2>
        </FadeIn>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 px-6 md:grid-cols-5">
          {[
            { e: '🍛', n: 'Restaurant', d: 'Dal bhat & thali' },
            { e: '☕', n: 'Cafe', d: 'Coffee & snacks' },
            { e: '🥐', n: 'Bakery', d: 'Fresh baked goods' },
            { e: '🛒', n: 'Mart', d: 'Grocery surplus' },
            { e: '🏨', n: 'Hotel', d: 'Buffet surplus' },
          ].map((c, i) => (
            <FadeIn key={c.n} delay={i * 80}>
              <div className="cursor-default rounded-2xl border border-[#F0EDE8] bg-white p-6 text-center transition-all duration-200 hover:border-[#D85A30] hover:bg-[#FAECE7] hover:shadow-md">
                <div className="text-4xl">{c.e}</div>
                <div className="mt-3 text-sm font-bold text-[#1A1A1A]">{c.n}</div>
                <div className="mt-1 text-xs text-[#9CA3AF]">{c.d}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* FOR RESTAURANTS */}
      <section id="for-restaurants" className="bg-[#1A1A1A] py-16 md:py-32">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-20 px-6 lg:grid-cols-2">
          <FadeIn>
            <span className="inline-block rounded-full bg-[#D85A30]/20 px-4 py-2 text-xs font-semibold text-[#D85A30]">
              🏪 Restaurant owners
            </span>
            <h2
              className="mt-4 font-black tracking-tight text-white"
              style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>
              Turn tonight&apos;s surplus
              <br />
              into revenue.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              Join LastBag as a restaurant partner. List your daily surplus in 2 minutes, reach
              hundreds of nearby customers, and reduce food waste.
            </p>

            <div className="mt-10 space-y-5">
              {[
                {
                  t: 'List in 2 minutes',
                  d: 'Name your bag, set the price and pickup time — goes live immediately',
                },
                {
                  t: 'Keep 100% of sales',
                  d: 'Zero commission. One flat monthly fee based on your business size',
                },
                {
                  t: 'Instant notifications',
                  d: 'Get notified the moment a customer reserves your bag',
                },
                {
                  t: '30-day free trial',
                  d: 'No payment required to get started. Try it completely free',
                },
              ].map((b) => (
                <div key={b.t} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D85A30]/15 font-bold text-[#D85A30]">
                    ✓
                  </div>
                  <div>
                    <div className="text-base font-semibold text-white">{b.t}</div>
                    <div className="mt-0.5 text-sm text-white/50">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <ContactTrialCta className="mt-10 rounded-2xl bg-[#D85A30] px-10 py-4 text-lg font-bold text-white shadow-xl shadow-[#D85A30]/25 transition hover:bg-[#993C1D]">
              Start free trial →
            </ContactTrialCta>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="space-y-4">
              {[
                {
                  tier: 'Small',
                  price: 'NPR 800',
                  desc: 'Dhaba, small cafe, home bakery',
                  features: ['Up to 10 bags/month', 'Standard listing', 'eSewa/Khalti payouts'],
                  popular: false,
                },
                {
                  tier: 'Medium',
                  price: 'NPR 1,800',
                  desc: 'Restaurant, bakery, cafe chain',
                  features: ['Unlimited bags/month', 'Priority placement', 'Sales analytics'],
                  popular: true,
                },
                {
                  tier: 'Large',
                  price: 'NPR 3,500',
                  desc: 'Hotel, supermarket, multi-branch',
                  features: ['Multiple branches', 'Featured placement', 'CO₂ impact reports'],
                  popular: false,
                },
              ].map((plan) => (
                <div
                  key={plan.tier}
                  className={`relative rounded-2xl bg-[#242424] p-6 ${
                    plan.popular ? 'border-2 border-[#D85A30]' : 'border border-white/8'
                  }`}>
                  {plan.popular ? (
                    <span className="absolute -top-3 left-6 rounded-full bg-[#D85A30] px-4 py-1 text-xs font-bold text-white">
                      Most popular
                    </span>
                  ) : null}
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-white">{plan.tier}</span>
                    <span>
                      <span className="text-2xl font-black text-[#D85A30]">{plan.price}</span>
                      <span className="text-sm text-white/40">/mo</span>
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/50">{plan.desc}</p>
                  <div className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <span className="text-sm text-[#10B981]">✓</span>
                        <span className="text-sm text-white/70">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CITIES */}
      <section id="cities" className="bg-white py-16 md:py-24">
        <FadeIn>
          <p className="text-center text-sm font-bold uppercase tracking-widest text-[#D85A30]">
            Where we&apos;re launching
          </p>
          <h2
            className="mt-4 text-center font-black tracking-tight text-[#1A1A1A]"
            style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Starting across Nepal
          </h2>
        </FadeIn>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
          {[
            { name: 'Kathmandu', np: 'काठमाडौं', first: true },
            { name: 'Lalitpur', np: 'ललितपुर', first: false },
            { name: 'Pokhara', np: 'पोखरा', first: false },
            { name: 'Bharatpur', np: 'भरतपुर', first: false },
          ].map((city, i) => (
            <FadeIn key={city.name} delay={i * 80}>
              <div
                className={`rounded-2xl p-8 text-center transition-all duration-200 ${
                  city.first
                    ? 'border border-[#F0997B] bg-[#FAECE7]'
                    : 'border border-[#E8E4DC] bg-[#F5F3EF]'
                }`}>
                <div className={`text-3xl ${city.first ? 'text-[#D85A30]' : 'text-[#9CA3AF]'}`}>
                  📍
                </div>
                <div className="mt-3 text-lg font-bold text-[#1A1A1A]">{city.name}</div>
                <div className={`mt-1 text-sm ${city.first ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                  {city.np}
                </div>
                {city.first ? (
                  <span className="mt-3 inline-block rounded-full bg-[#D85A30] px-3 py-1 text-xs font-bold text-white">
                    Launching first
                  </span>
                ) : (
                  <span className="mt-3 inline-block rounded-full border border-[#E8E4DC] bg-[#F5F3EF] px-3 py-1 text-xs text-[#9CA3AF]">
                    Coming soon
                  </span>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#F5F3EF] py-16 md:py-24">
        <FadeIn>
          <p className="text-center text-sm font-bold uppercase tracking-widest text-[#D85A30]">
            Early feedback
          </p>
          <h2
            className="mt-4 text-center font-black tracking-tight text-[#1A1A1A]"
            style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            What people are saying
          </h2>
        </FadeIn>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 px-6 md:grid-cols-3">
          {[
            {
              q: 'I used to throw away dal bhat every night. With LastBag, I list it in 2 minutes and customers pick it up. Zero waste, extra income.',
              initials: 'KG',
              name: 'Thakali Kitchen',
              role: 'Partner · Thamel',
            },
            {
              q: 'Got a full meal for ₨150 instead of ₨500. The bag was packed generously and the food was delicious. Will definitely use again!',
              initials: 'PS',
              name: 'Priya S.',
              role: 'Customer · Kathmandu',
            },
            {
              q: 'Simple to set up, easy for my staff to use. The QR scan takes 5 seconds. Best part — I keep everything I earn.',
              initials: 'RB',
              name: 'Himalayan Bakery',
              role: 'Partner · Lalitpur',
            },
          ].map((t, i) => (
            <FadeIn key={t.initials} delay={(i + 1) * 100}>
              <div className="rounded-3xl border border-[#F0EDE8] bg-white p-8 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
                <div className="text-lg text-[#D85A30]">★★★★★</div>
                <p className="mt-4 text-base italic leading-relaxed text-[#1A1A1A]">&ldquo;{t.q}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAECE7] text-sm font-bold text-[#D85A30]">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1A1A1A]">{t.name}</div>
                    <div className="mt-0.5 text-xs text-[#9CA3AF]">{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* DOWNLOAD CTA */}
      <section id="download" className="bg-[#D85A30] py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <FadeIn>
            <h2
              className="font-black tracking-tight text-white"
              style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>
              Ready to rescue food?
            </h2>
            <p className="mt-6 text-xl text-white/75">
              Download LastBag — free to use, free to reserve. Pay only when you pick up.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a
                href="#download"
                className="flex items-center gap-3 rounded-2xl bg-black px-8 py-4 text-white transition hover:bg-[#1A1A1A]">
                <AppleIcon />
                <span className="text-left">
                  <span className="block text-xs text-white/60">Download on the</span>
                  <span className="block text-lg font-bold">App Store</span>
                </span>
              </a>
              <a
                href="#download"
                className="flex items-center gap-3 rounded-2xl bg-black px-8 py-4 text-white transition hover:bg-[#1A1A1A]">
                <PlayIcon />
                <span className="text-left">
                  <span className="block text-xs text-white/60">Get it on</span>
                  <span className="block text-lg font-bold">Google Play</span>
                </span>
              </a>
            </div>

            <p className="mt-6 text-sm text-white/50">Coming soon to iOS and Android</p>

            <div className="mt-12">
              <p className="text-sm text-white/40">— or —</p>
              <p className="mt-4 text-base text-white/70">Talk to us directly</p>
              <a
                href="tel:0405290710"
                className="mt-2 inline-block text-2xl font-black text-white transition hover:text-white/80">
                0405 290 710
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-16 md:py-24">
        <FadeIn>
          <h2
            className="text-center font-black tracking-tight text-[#1A1A1A]"
            style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
            Common questions
          </h2>
        </FadeIn>
        <div className="mx-auto mt-12 max-w-2xl px-6">
          <FaqAccordion items={faqItems} />
        </div>
      </section>
    </main>
  );
}
