import { ContactTrialCta } from '@/components/ContactTrialCta';
import { FadeIn } from '@/components/FadeIn';
import { FaqAccordion } from '@/components/FaqAccordion';
import { LiveImpactStats } from '@/components/LiveImpactStats';
import { WaitlistForm } from '@/components/WaitlistForm';

const TICKER_ITEMS = [
  'Thakali Kitchen · Thamel',
  'Java Coffee · Lazimpat',
  'Himalayan Bakery · Patan',
  'Hotel Yak & Yeti · Durbarmarg',
  'Bhat-Bhateni · Maharajgunj',
  'Bhojan Griha · Dillibazar',
  'Roadhouse Cafe · Thamel',
  'Bakery Cafe · Durbar Marg',
];

function AppleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.8-1.5 0-2.8.9-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.3 2.8 2.2 1.1-.1 1.5-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-.9 2.7-2 .9-1.2 1.2-2.4 1.2-2.5-.1 0-2.2-.9-2.2-3.6zM14.5 5.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 22 24" fill="none" aria-hidden>
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
      a: 'A rescue bag is a discounted surprise bag of surplus food from a restaurant, cafe, bakery or mart in Nepal that would otherwise go to waste. You know the type of food and the pickup window — but the exact contents are a surprise. That’s what makes it fun!',
    },
    {
      id: 'save',
      q: 'How much do I save?',
      a: 'Typically 50–70% off the original price. A dal bhat that normally costs ₨400–500 might be available as a rescue bag for just ₨150. A bakery mix worth ₨600 for only ₨200.',
    },
    {
      id: 'pay',
      q: 'Do I pay in the app?',
      a: 'No — LastBag is completely free to use. You reserve your bag for free and pay at the counter when you pick it up. Cash, eSewa, or Khalti — whatever the restaurant accepts. We never touch your money.',
    },
    {
      id: 'dinein',
      q: 'Can I dine-in instead of takeaway?',
      a: 'Yes! Many restaurants on LastBag offer both dine-in and takeaway options. Some charge a small extra amount for dine-in (table, service). You choose when you reserve your bag.',
    },
    {
      id: 'cancel',
      q: 'Can I cancel a reservation?',
      a: 'Yes, you can cancel for free up to 1 hour before the pickup window starts. Within 30 minutes of pickup, cancellation is not allowed as the restaurant has already prepared your bag.',
    },
    {
      id: 'city',
      q: 'Is LastBag available in my city?',
      a: 'We’re launching in Kathmandu first, with Lalitpur, Pokhara, and Bharatpur following soon. Enter your email in the waitlist below and we’ll notify you when we launch near you!',
    },
    {
      id: 'partner',
      q: 'I run a restaurant. How do I join?',
      a: 'Call or WhatsApp us on 9762623241 or click “For restaurants” above. We’ll visit your restaurant, set up your account, and have you live on LastBag same day — with a free 30-day trial. No payment needed to start.',
    },
    {
      id: 'pickup',
      q: 'How does pickup verification work?',
      a: 'Three simple ways — (1) restaurant scans your QR code from the app, (2) you show a 6-digit code, or (3) restaurant manually marks your order as picked up. Takes under 10 seconds!',
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* HERO — brand, headline, support, CTAs, product visual */}
      <section className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-[var(--ink)] pt-[72px]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 85% 20%, rgba(216,90,48,0.22), transparent 60%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(216,90,48,0.08), transparent 55%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          }}
        />

        <div className="relative mx-auto grid max-w-[1120px] items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-20">
          <FadeIn>
            <div className="text-center lg:text-left">
              <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                LastBag
              </p>
              <h1
                className="mt-5 font-display font-extrabold leading-[0.96] text-white"
                style={{ fontSize: 'clamp(2.75rem, 7vw, 4.75rem)' }}>
                Rescue great food.
                <span className="mt-1 block text-[#E8622F]">Save up to 70%.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-white/55 lg:mx-0">
                Surplus bags from restaurants, cafés, and bakeries near you — free to reserve, pay
                at pickup.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a href="#download" className="btn-primary text-[15px]">
                  Download the app
                </a>
                <ContactTrialCta className="btn-ghost-light text-[15px]">
                  I run a restaurant
                </ContactTrialCta>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={140}>
            <div className="relative mx-auto hidden w-full max-w-[340px] lg:block">
              <div
                className="animate-float relative mx-auto h-[580px] w-[290px] overflow-hidden rounded-[42px] border border-white/10 bg-[#141414]"
                style={{ boxShadow: '0 20px 60px rgba(216,90,48,0.2)' }}>
                <div className="mx-auto mt-0 h-7 w-28 rounded-b-2xl bg-black/80" />
                <div className="bg-[var(--primary)] px-5 pb-7 pt-4">
                  <p className="text-sm font-semibold text-white">Good evening</p>
                  <p className="mt-1 text-xs text-white/65">Thamel, Kathmandu</p>
                </div>
                <div className="bg-[var(--bg)] px-4 py-4">
                  <div className="mb-3 rounded-xl bg-white px-3 py-2.5 text-xs text-[var(--text-muted)]">
                    Search restaurants, bakeries…
                  </div>
                  <div className="mb-4 flex gap-2">
                    {['All', 'Cafe', 'Bakery'].map((c, i) => (
                      <span
                        key={c}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          i === 0
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-white text-[var(--text-secondary)]'
                        }`}>
                        {c}
                      </span>
                    ))}
                  </div>
                  {[
                    {
                      partner: 'Thakali Kitchen',
                      title: 'Dal Bhat Set',
                      price: '₨ 150',
                      was: '₨ 500',
                      tone: 'bg-[#FAECE7]',
                    },
                    {
                      partner: 'Himalayan Bakery',
                      title: 'Bakery Mix',
                      price: '₨ 200',
                      was: '₨ 600',
                      tone: 'bg-[#F3EEE8]',
                    },
                  ].map((bag) => (
                    <div
                      key={bag.title}
                      className="mb-2.5 flex items-start gap-3 rounded-2xl bg-white p-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bag.tone}`}>
                        <span className="font-display text-sm font-bold text-[var(--primary)]">
                          LB
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-[var(--text-muted)]">{bag.partner}</p>
                        <p className="mt-0.5 text-sm font-semibold text-[var(--ink)]">{bag.title}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-[var(--primary)]">
                              {bag.price}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] line-through">
                              {bag.was}
                            </span>
                          </div>
                          <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-bold text-white">
                            Reserve
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Proof strip */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-[1120px] grid-cols-3 divide-x divide-[var(--border)] px-6 py-8">
          {[
            { n: '4', l: 'Cities launching' },
            { n: '70%', l: 'Max savings per bag' },
            { n: 'Free', l: 'To reserve a bag' },
          ].map((stat) => (
            <div key={stat.l} className="px-4 text-center md:px-8">
              <p className="font-display text-2xl font-bold text-[var(--ink)] md:text-3xl">
                {stat.n}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)] md:text-sm">{stat.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ticker */}
      <section className="overflow-hidden border-b border-[var(--border)] bg-white py-5">
        <div className="marquee-track inline-flex min-w-[200%] gap-10">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center whitespace-nowrap text-sm text-[var(--text-secondary)]">
              {item}
              <span className="mx-4 text-[var(--primary)]">·</span>
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#F5F3EF] py-24 md:py-32">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">How it works</p>
            <h2
              className="mt-4 font-display font-bold tracking-tight text-[#1A1A1A]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Rescue food in three steps
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              No upfront payment. Reserve, arrive, and enjoy.
            </p>
          </div>
        </FadeIn>

        <div className="mx-auto mt-16 grid max-w-[1120px] gap-4 px-6 md:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Browse nearby',
              desc: 'Find rescue bags from restaurants, cafés, bakeries, and hotels around you.',
            },
            {
              n: '02',
              title: 'Reserve for free',
              desc: 'Lock your bag in seconds. No card. No checkout friction.',
            },
            {
              n: '03',
              title: 'Pick up & pay',
              desc: 'Arrive in the pickup window, confirm with QR, and pay at the counter.',
            },
          ].map((step, i) => (
            <FadeIn key={step.n} delay={(i + 1) * 90}>
              <div className="h-full rounded-[28px] border border-[#E8E4DC] bg-white px-8 py-10 md:px-10 md:py-12">
                <p className="font-display text-sm font-semibold text-[var(--primary)]">{step.n}</p>
                <h3 className="mt-6 font-display text-2xl font-bold text-[#1A1A1A]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                  {step.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24 md:py-32">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">Why LastBag</p>
            <h2
              className="mt-4 font-display font-bold tracking-tight text-[var(--ink)]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Built for Nepal&apos;s food scene
            </h2>
          </div>
        </FadeIn>

        <div className="mx-auto mt-16 grid max-w-[1120px] gap-4 px-6 md:grid-cols-3">
          <FadeIn delay={80}>
            <div className="relative min-h-[260px] overflow-hidden rounded-[28px] bg-[var(--primary-light)] p-9 md:col-span-2">
              <h3 className="font-display text-2xl font-bold text-[var(--ink)]">
                Reserve in seconds
              </h3>
              <p className="mt-3 max-w-sm text-[15px] text-[var(--text-secondary)]">
                Browse freely. Reserve with your details — no payment until pickup.
              </p>
              <div className="mt-10 max-w-xs rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="mb-2 h-8 rounded-lg bg-[var(--bg)]" />
                <div className="mb-3 h-8 rounded-lg bg-[var(--bg)]" />
                <div className="rounded-lg bg-[var(--primary)] py-2.5 text-center text-xs font-semibold text-white">
                  Confirm reservation
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={140}>
            <div className="min-h-[260px] rounded-[28px] bg-[var(--ink)] p-9">
              <h3 className="font-display text-2xl font-bold text-white">QR pickup</h3>
              <p className="mt-3 text-[15px] text-white/50">
                Show your code, pay at the counter, done.
              </p>
              <div className="mt-10 grid grid-cols-4 gap-1.5 opacity-80">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm ${
                      [0, 1, 2, 4, 5, 8, 10, 12, 13, 14].includes(i) ? 'bg-white' : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="min-h-[240px] rounded-[28px] bg-[var(--bg)] p-9">
              <h3 className="font-display text-2xl font-bold text-[var(--ink)]">Live updates</h3>
              <p className="mt-3 text-[15px] text-[var(--text-secondary)]">
                Partners get notified the moment a bag is reserved.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={160}>
            <div className="relative min-h-[240px] overflow-hidden rounded-[28px] bg-[var(--primary)] p-9 md:col-span-2">
              <p className="pointer-events-none absolute -bottom-4 right-4 font-display text-[7rem] font-extrabold leading-none text-white/10">
                100%
              </p>
              <h3 className="font-display text-2xl font-bold text-white">Zero commission</h3>
              <p className="mt-3 max-w-sm text-[15px] text-white/75">
                Partners keep every sale. One flat monthly fee after a free 30-day trial.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="bg-[#D85A30] py-24 md:py-28">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label !text-white/70">Impact</p>
            <h2
              className="mt-4 font-display font-bold tracking-tight text-white"
              style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)' }}>
              Every bag rescued matters
            </h2>
            <p className="mt-4 text-white/75">
              Real impact, one rescue bag at a time.
            </p>
          </div>
        </FadeIn>
        <LiveImpactStats />
      </section>

      {/* Categories */}
      <section className="bg-[#F5F3EF] py-24">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">Partners</p>
            <h2
              className="mt-4 font-display font-bold tracking-tight text-[#1A1A1A]"
              style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)' }}>
              Every type of kitchen
            </h2>
          </div>
        </FadeIn>
        <div className="mx-auto mt-12 grid max-w-[900px] grid-cols-2 gap-3 px-6 md:grid-cols-5 md:gap-4">
          {[
            { n: 'Restaurant', d: 'Dal bhat & thali' },
            { n: 'Cafe', d: 'Coffee & snacks' },
            { n: 'Bakery', d: 'Fresh baked goods' },
            { n: 'Mart', d: 'Grocery surplus' },
            { n: 'Hotel', d: 'Buffet surplus' },
          ].map((c, i) => (
            <FadeIn key={c.n} delay={i * 60}>
              <div className="rounded-2xl border border-[#E8E4DC] bg-white px-4 py-6 text-center transition hover:bg-[#FAECE7]">
                <p className="font-display text-base font-bold text-[#1A1A1A]">{c.n}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{c.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* For restaurants */}
      <section id="for-restaurants" className="bg-[#1A1A1A] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1120px] items-start gap-16 px-6 lg:grid-cols-2 lg:gap-20">
          <FadeIn>
            <p className="section-label">For restaurants</p>
            <h2
              className="mt-4 font-display font-bold tracking-tight text-white"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Turn tonight&apos;s surplus into revenue — and rescue food while you&apos;re at it.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/55">
              List daily surplus in minutes, reach nearby customers, and keep 100% of every sale.
            </p>

            <div className="mt-10 space-y-6">
              {[
                {
                  t: 'List in 2 minutes',
                  d: 'Name your bag, set price and pickup window — live immediately.',
                },
                {
                  t: 'Keep 100% of sales',
                  d: 'Zero commission. One flat monthly fee based on business size.',
                },
                {
                  t: '30-day free trial',
                  d: 'No payment required to start. Cancel anytime.',
                },
              ].map((b) => (
                <div key={b.t} className="border-l border-[var(--primary)] pl-5">
                  <p className="font-display text-lg font-semibold text-white">{b.t}</p>
                  <p className="mt-1 text-sm text-white/45">{b.d}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-sm font-medium text-[#E8A87C]">
              🇳🇵 Currently onboarding restaurants in Kathmandu
            </p>
            <ContactTrialCta className="btn-primary mt-4 text-[15px]">
              Start free trial
            </ContactTrialCta>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="space-y-3">
              {[
                {
                  tier: 'Small',
                  price: 'NPR 800',
                  desc: 'Dhaba, small cafe, home bakery',
                  features: ['Up to 5 bags / day', 'QR pickup', 'Email support'],
                  popular: false,
                },
                {
                  tier: 'Medium',
                  price: 'NPR 1,800',
                  desc: 'Restaurant, bakery, cafe chain',
                  features: ['Unlimited bags', 'Analytics', 'Priority support'],
                  popular: true,
                },
                {
                  tier: 'Large',
                  price: 'NPR 3,500',
                  desc: 'Hotel, supermarket, multi-branch',
                  features: ['Multi-branch', 'Featured placement', 'Dedicated support'],
                  popular: false,
                },
              ].map((plan) => (
                <div
                  key={plan.tier}
                  className={`rounded-2xl p-6 ${
                    plan.popular
                      ? 'border border-[var(--primary)] bg-[#1c1c1c]'
                      : 'border border-white/8 bg-[#191919]'
                  }`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-white">
                        {plan.tier}
                        {plan.popular ? (
                          <span className="ml-2 text-xs font-semibold text-[var(--primary)]">
                            Popular
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-white/40">{plan.desc}</p>
                    </div>
                    <p>
                      <span className="font-display text-xl font-bold text-[var(--primary)]">
                        {plan.price}
                      </span>
                      <span className="text-sm text-white/35">/mo</span>
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    {plan.features.map((f) => (
                      <span key={f} className="text-sm text-white/55">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="bg-white py-24">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">Cities</p>
            <h2
              className="mt-4 font-display font-bold tracking-tight text-[#1A1A1A]"
              style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)' }}>
              Starting across Nepal
            </h2>
          </div>
        </FadeIn>

        <div className="mx-auto mt-12 grid max-w-[900px] grid-cols-2 gap-4 px-6 md:grid-cols-4">
          {[
            { name: 'Kathmandu', np: 'काठमाडौं', first: true },
            { name: 'Lalitpur', np: 'ललितपुर', first: false },
            { name: 'Pokhara', np: 'पोखरा', first: false },
            { name: 'Bharatpur', np: 'भरतपुर', first: false },
          ].map((city, i) => (
            <FadeIn key={city.name} delay={i * 70}>
              <div
                className={`rounded-2xl px-5 py-8 text-center ${
                  city.first
                    ? 'bg-[#FAECE7]'
                    : 'border border-[#E8E4DC] bg-[#F5F3EF]'
                }`}>
                <p className="font-display text-xl font-bold text-[#1A1A1A]">{city.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{city.np}</p>
                <p
                  className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    city.first ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                  }`}>
                  {city.first ? 'Launching first' : 'Coming soon'}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Download */}
      <section id="download" className="relative overflow-hidden bg-[#D85A30] py-24 md:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.25), transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <FadeIn>
            <h2
              className="font-display font-bold tracking-tight text-white"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Ready to rescue food?
            </h2>
            <p className="mt-5 text-lg text-white/75">
              Free to use. Free to reserve. Pay only when you pick up.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-full bg-[var(--ink)] px-6 py-3.5 text-white transition hover:bg-black">
                <AppleIcon />
                <span className="text-left">
                  <span className="block text-[10px] text-white/55">Download on the</span>
                  <span className="block text-sm font-semibold">App Store</span>
                </span>
              </a>
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-full bg-[var(--ink)] px-6 py-3.5 text-white transition hover:bg-black">
                <PlayIcon />
                <span className="text-left">
                  <span className="block text-[10px] text-white/55">Get it on</span>
                  <span className="block text-sm font-semibold">Google Play</span>
                </span>
              </a>
            </div>

            <p className="mt-5 text-sm text-white/55">Coming soon to iOS and Android</p>
            <a
              href="#waitlist"
              className="mt-3 inline-block text-sm text-[#9CA3AF] underline-offset-2 transition hover:underline">
              🔔 Notify me when it launches
            </a>

            <div className="mt-12 border-t border-white/15 pt-8">
              <p className="text-sm text-white/65">Talk to us</p>
              <a
                href="tel:+9779762623241"
                className="mt-2 inline-block font-display text-2xl font-bold text-white transition hover:text-white/85">
                9762623241
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-24">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">FAQ</p>
            <h2
              className="mt-4 font-display font-bold tracking-tight text-[#1A1A1A]"
              style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)' }}>
              Common questions
            </h2>
          </div>
        </FadeIn>
        <div className="mx-auto mt-12 max-w-2xl px-6">
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      <WaitlistForm />
    </main>
  );
}
