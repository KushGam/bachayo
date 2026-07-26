import { ContactTrialCta } from '@/components/ContactTrialCta';
import { FadeIn } from '@/components/FadeIn';
import { FaqAccordion } from '@/components/FaqAccordion';
import { LiveImpactStats } from '@/components/LiveImpactStats';
import { WaitlistForm } from '@/components/WaitlistForm';

const VALUE_TICKER = [
  'Save up to 70%',
  'Free to reserve',
  'Pay only at pickup',
  'Zero commission for partners',
  'Rescue surplus food',
  'QR pickup in seconds',
  'Live across Nepal',
  '30-day free partner trial',
];

const REASONS = [
  {
    title: 'Eat better. Spend less.',
    body: 'Surprise bags of quality surplus food — typically half the price of a regular meal. Same kitchens. Same care. A smarter bill.',
  },
  {
    title: 'No payment games.',
    body: 'Reserve for free. Pay cash, eSewa, or Khalti at the counter. We never hold your money or charge booking fees.',
  },
  {
    title: 'Food that almost went to waste.',
    body: 'Every bag you rescue keeps good food on a plate instead of in the bin — and helps kitchens earn from what they already cooked.',
  },
  {
    title: 'Pickup that actually works.',
    body: 'Clear pickup windows, live chat with the kitchen, and QR confirmation. In and out in under a minute.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'I stop by after class, grab a bag for half the price of delivery, and still eat something real. It’s become my weeknight habit.',
    role: 'Student',
    place: 'Regular user',
  },
  {
    quote:
      'Listing leftover lunch takes two minutes. Bags sell before the window closes — and we keep every rupee. No commission cut.',
    role: 'Restaurant partner',
    place: 'Partner kitchen',
  },
  {
    quote:
      'The surprise is half the fun. Bakery mixes, thali sets, café leftovers — always a deal, never a waste.',
    role: 'Regular customer',
    place: 'Food lover',
  },
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
      a: 'A discounted surprise bag of surplus food from a restaurant, café, bakery, or mart that would otherwise go to waste. You know the type of food and the pickup window — the exact mix is the surprise.',
    },
    {
      id: 'save',
      q: 'How much do I save?',
      a: 'Typically 50–70% off the original value. A meal that might cost ₨400–500 can land as a rescue bag around ₨150. Bakery mixes worth ₨600 often go for around ₨200.',
    },
    {
      id: 'pay',
      q: 'Do I pay in the app?',
      a: 'No. LastBag is free to use. Reserve for free, then pay at the counter when you pick up — cash, eSewa, or Khalti, whatever the kitchen accepts. We never take your payment.',
    },
    {
      id: 'dinein',
      q: 'Can I dine-in instead of takeaway?',
      a: 'Yes. Many partners offer both. Some add a small dine-in charge for table service — you choose when you reserve.',
    },
    {
      id: 'cancel',
      q: 'Can I cancel a reservation?',
      a: 'Yes — free cancellation up to 1 hour before the pickup window. Close to pickup (within 30 minutes), cancellation is locked so the kitchen isn’t left with prepared food.',
    },
    {
      id: 'city',
      q: 'Is LastBag available in my city?',
      a: 'Yes. LastBag works wherever partners list bags near you. Open the app and browse — join the waitlist below for launch updates.',
    },
    {
      id: 'partner',
      q: 'I run a restaurant. How do I join?',
      a: 'Call or WhatsApp 9716318840, or tap “For restaurants.” We’ll help you go live the same day with a free 30-day trial — no payment to start.',
    },
    {
      id: 'pickup',
      q: 'How does pickup verification work?',
      a: 'Three ways: the kitchen scans your QR, you show a 6-digit code, or they mark pickup manually. Usually under 10 seconds.',
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* HERO — one composition: brand, headline, line, CTAs, product visual */}
      <section className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-[var(--ink)] pt-[72px]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 60% at 88% 18%, rgba(216,90,48,0.28), transparent 58%), radial-gradient(ellipse 45% 40% at 8% 88%, rgba(216,90,48,0.1), transparent 55%), radial-gradient(ellipse 80% 50% at 50% 100%, rgba(0,0,0,0.45), transparent 60%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse at 70% 40%, black 15%, transparent 72%)',
          }}
        />

        <div className="relative mx-auto grid max-w-[1120px] items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-20">
          <FadeIn>
            <div className="text-center lg:text-left">
              <p className="font-display text-[clamp(1.35rem,3vw,1.75rem)] font-extrabold tracking-tight text-white">
                LastBag
              </p>
              <h1
                className="mt-5 font-display font-extrabold leading-[0.94] text-white"
                style={{ fontSize: 'clamp(2.65rem, 6.5vw, 4.5rem)' }}>
                Great food.
                <span className="mt-1 block text-[var(--primary-bright)]">Half the price.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-white/55 lg:mx-0">
                Rescue surplus bags from kitchens near you. Free to reserve. Pay only when you pick
                up.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a href="#download" className="btn-primary text-[15px]">
                  Download the app
                </a>
                <ContactTrialCta className="btn-ghost-light text-[15px]">
                  Partner with us
                </ContactTrialCta>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={140}>
            <div className="relative mx-auto hidden w-full max-w-[360px] lg:block">
              <div
                className="pointer-events-none absolute -inset-8 rounded-[48px] opacity-70 blur-2xl"
                style={{
                  background:
                    'radial-gradient(circle at 50% 40%, rgba(216,90,48,0.35), transparent 65%)',
                }}
              />
              <div
                className="animate-float relative mx-auto h-[580px] w-[290px] overflow-hidden rounded-[42px] border border-white/12 bg-[#121212]"
                style={{ boxShadow: 'var(--shadow-warm), 0 0 0 1px rgba(255,255,255,0.04)' }}>
                <div className="mx-auto mt-0 h-7 w-28 rounded-b-2xl bg-black/85" />
                <div className="bg-[var(--primary)] px-5 pb-7 pt-4">
                  <p className="text-sm font-semibold text-white">Bags near you</p>
                  <p className="mt-1 text-xs text-white/65">Closing soon · today</p>
                </div>
                <div className="bg-[var(--bg)] px-4 py-4">
                  <div className="mb-3 rounded-xl bg-white px-3 py-2.5 text-xs text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
                    Search bags, cafés, bakeries…
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
                      kind: 'Restaurant',
                      title: 'Lunch surprise bag',
                      price: '₨ 150',
                      was: '₨ 500',
                      save: '70% off',
                      tone: 'bg-[#FAECE7]',
                    },
                    {
                      kind: 'Bakery',
                      title: 'End-of-day mix',
                      price: '₨ 200',
                      was: '₨ 600',
                      save: '67% off',
                      tone: 'bg-[#F3EEE8]',
                    },
                  ].map((bag) => (
                    <div
                      key={bag.title}
                      className="mb-2.5 flex items-start gap-3 rounded-2xl bg-white p-3 shadow-[var(--shadow-sm)]">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bag.tone}`}>
                        <span className="font-display text-sm font-bold text-[var(--primary)]">
                          LB
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-[var(--text-muted)]">{bag.kind}</p>
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
                          <span className="rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary-dark)]">
                            {bag.save}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="mt-3 text-center text-[11px] text-[var(--text-muted)]">
                    Free to reserve · Pay at pickup
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Proof */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-[1120px] grid-cols-3 divide-x divide-[var(--border)] px-6 py-10">
          {[
            { n: '70%', l: 'Typical savings' },
            { n: '₨0', l: 'To reserve' },
            { n: '100%', l: 'Partners keep' },
          ].map((stat) => (
            <div key={stat.l} className="px-4 text-center md:px-8">
              <p className="font-display text-2xl font-bold tracking-tight text-[var(--ink)] md:text-[2rem]">
                {stat.n}
              </p>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] md:text-xs">
                {stat.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Value ticker — no fake venue names */}
      <section className="overflow-hidden border-b border-[var(--border)] bg-white py-5" aria-hidden>
        <div className="marquee-track inline-flex min-w-[200%] gap-10">
          {[...VALUE_TICKER, ...VALUE_TICKER].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center whitespace-nowrap text-sm font-medium tracking-wide text-[var(--text-secondary)]">
              {item}
              <span className="mx-5 text-[var(--primary)]">·</span>
            </span>
          ))}
        </div>
      </section>

      {/* Why use LastBag */}
      <section id="why" className="bg-[var(--bg)] py-24 md:py-32">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">Why LastBag</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-[var(--ink)]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              The smarter way to eat out
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Built for people who want great food without the full price — and kitchens that hate
              waste.
            </p>
          </div>
        </FadeIn>

        <div className="mx-auto mt-16 grid max-w-[1120px] gap-4 px-6 md:grid-cols-2">
          {REASONS.map((reason, i) => (
            <FadeIn key={reason.title} delay={(i + 1) * 70}>
              <div className="premium-card h-full px-8 py-9 md:px-10">
                <p className="font-display text-xs font-semibold text-[var(--primary)]">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-4 font-display text-xl font-bold text-[var(--ink)] md:text-2xl">
                  {reason.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                  {reason.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="stories" className="relative overflow-hidden bg-[var(--ink)] py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 10% 20%, rgba(216,90,48,0.2), transparent 55%), radial-gradient(ellipse 40% 35% at 90% 80%, rgba(216,90,48,0.12), transparent 50%)',
          }}
        />
        <FadeIn>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <p className="section-label !text-[var(--primary-bright)]">Real reasons people stay</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-white"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Not another delivery app.
              <span className="mt-1 block text-white/50">A rescue habit.</span>
            </h2>
          </div>
        </FadeIn>

        <div className="relative mx-auto mt-16 grid max-w-[1120px] gap-5 px-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.role} delay={(i + 1) * 90}>
              <blockquote className="flex h-full flex-col rounded-[28px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
                <p className="font-display text-3xl font-bold leading-none text-[var(--primary-bright)]">
                  “
                </p>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-white/80">{t.quote}</p>
                <footer className="mt-8 border-t border-white/10 pt-5">
                  <p className="text-sm font-semibold text-white">{t.role}</p>
                  <p className="mt-0.5 text-xs text-white/40">{t.place}</p>
                </footer>
              </blockquote>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-24 md:py-32">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">How it works</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-[var(--ink)]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Three steps. Zero friction.
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              No upfront payment. Reserve, arrive, enjoy.
            </p>
          </div>
        </FadeIn>

        <div className="mx-auto mt-16 grid max-w-[1120px] gap-5 px-6 md:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Browse nearby',
              desc: 'See rescue bags from restaurants, cafés, bakeries, and marts around you — with prices and pickup windows upfront.',
            },
            {
              n: '02',
              title: 'Reserve for free',
              desc: 'Lock your bag in seconds. No card. No checkout. Your spot is held until pickup.',
            },
            {
              n: '03',
              title: 'Pick up & pay',
              desc: 'Arrive in the window, confirm with QR, pay at the counter. Done.',
            },
          ].map((step, i) => (
            <FadeIn key={step.n} delay={(i + 1) * 90}>
              <div className="premium-card group h-full px-8 py-10 md:px-10 md:py-12">
                <p className="font-display text-sm font-semibold text-[var(--primary)]">{step.n}</p>
                <div className="mt-5 h-px w-10 bg-[var(--border)] transition group-hover:w-16 group-hover:bg-[var(--primary)]/40" />
                <h3 className="mt-6 font-display text-2xl font-bold text-[var(--ink)]">{step.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                  {step.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[var(--bg)] py-24 md:py-32">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">Built different</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-[var(--ink)]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Designed for how Nepal eats
            </h2>
          </div>
        </FadeIn>

        <div className="mx-auto mt-16 grid max-w-[1120px] gap-5 px-6 md:grid-cols-3">
          <FadeIn delay={80}>
            <div className="relative min-h-[280px] overflow-hidden rounded-[28px] bg-[var(--primary-light)] p-9 shadow-[var(--shadow-sm)] md:col-span-2">
              <h3 className="font-display text-2xl font-bold text-[var(--ink)]">
                Reserve in seconds
              </h3>
              <p className="mt-3 max-w-sm text-[15px] text-[var(--text-secondary)]">
                Browse freely. Leave your name and phone — pay nothing until you pick up.
              </p>
              <div className="mt-6 rotate-1 rounded-2xl border border-[var(--border-soft)] bg-white p-5 shadow-[var(--shadow-md)]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Your name
                </p>
                <p className="mt-2 rounded-lg bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
                  Your name here
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Phone
                </p>
                <p className="mt-2 rounded-lg bg-[var(--bg)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
                  +977 98XXXXXXXX
                </p>
                <div className="mt-4 rounded-full bg-[var(--primary)] py-3 text-center text-sm font-bold text-white">
                  Confirm reservation →
                </div>
                <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
                  Free to reserve · Pay at pickup
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={140}>
            <div className="relative min-h-[280px] overflow-hidden rounded-[28px] bg-[var(--ink)] p-9 shadow-[var(--shadow-md)]">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    'radial-gradient(circle at 80% 20%, rgba(216,90,48,0.35), transparent 50%)',
                }}
              />
              <h3 className="relative font-display text-2xl font-bold text-white">QR pickup</h3>
              <p className="relative mt-3 text-[15px] text-white/50">
                Show your code. Pay at the counter. Walk out smiling.
              </p>
              <div className="relative mt-8 flex flex-col items-center">
                <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-md)]">
                  <div className="grid h-[120px] w-[120px] grid-cols-5 grid-rows-5 gap-1">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-[2px] ${
                          [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24].includes(i)
                            ? 'bg-[var(--ink)]'
                            : 'bg-[var(--border)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-white/10 px-5 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Order code</p>
                  <p className="mt-1 font-mono text-xl font-bold tracking-[0.35em] text-white">
                    LB·8821
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="min-h-[240px] rounded-[28px] border border-[var(--border)] bg-white p-9 shadow-[var(--shadow-sm)]">
              <h3 className="font-display text-2xl font-bold text-[var(--ink)]">Live for kitchens</h3>
              <p className="mt-3 text-[15px] text-[var(--text-secondary)]">
                Partners see every reservation the moment it lands.
              </p>
              <div className="mt-6 space-y-2">
                {[
                  { title: 'New reservation', detail: '2× lunch bags locked in', tone: 'bg-[#FAECE7]' },
                  { title: 'Pickup window open', detail: 'Customers arriving now', tone: 'bg-[#FEF3C7]' },
                  { title: 'Sold out today', detail: 'All bags reserved', tone: 'bg-[#ECFDF5]' },
                ].map((n) => (
                  <div
                    key={n.title}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-3.5 py-3">
                    <div className={`h-9 w-9 shrink-0 rounded-full ${n.tone}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--ink)]">{n.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{n.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={160}>
            <div className="relative min-h-[240px] overflow-hidden rounded-[28px] bg-[var(--primary)] p-9 shadow-[var(--shadow-warm)] md:col-span-2">
              <p className="pointer-events-none absolute -bottom-4 right-4 font-display text-[7rem] font-extrabold leading-none text-white/10">
                0%
              </p>
              <h3 className="relative font-display text-2xl font-bold text-white">
                Zero commission. Always.
              </h3>
              <p className="relative mt-3 max-w-md text-[15px] text-white/75">
                Partners keep every sale. One flat monthly fee after a free 30-day trial — no
                percentage cut on your food.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="relative overflow-hidden bg-[var(--primary)] py-24 md:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 15% 0%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(ellipse at 90% 100%, rgba(0,0,0,0.18), transparent 40%)',
          }}
        />
        <FadeIn>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <p className="section-label !text-white/75">Impact</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-white"
              style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)' }}>
              Every bag you rescue counts
            </h2>
            <p className="mt-4 text-white/75">Less waste. More meals. Real numbers.</p>
          </div>
        </FadeIn>
        <div className="relative">
          <LiveImpactStats />
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-24">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">Who lists</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-[var(--ink)]"
              style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)' }}>
              Every kind of kitchen
            </h2>
            <p className="mt-4 text-[15px] text-[var(--text-secondary)]">
              From neighborhood thalis to end-of-day bakery trays — surplus finds a home.
            </p>
          </div>
        </FadeIn>
        <div className="mx-auto mt-12 grid max-w-[900px] grid-cols-2 gap-3 px-6 md:grid-cols-5 md:gap-4">
          {[
            { n: 'Restaurant', d: 'Thali & daily specials' },
            { n: 'Cafe', d: 'Coffee & snacks' },
            { n: 'Bakery', d: 'Fresh baked goods' },
            { n: 'Mart', d: 'Grocery surplus' },
            { n: 'Hotel', d: 'Buffet leftovers' },
          ].map((c, i) => (
            <FadeIn key={c.n} delay={i * 60}>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-7 text-center shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/25 hover:bg-[var(--primary-light)] hover:shadow-[var(--shadow-md)]">
                <p className="font-display text-base font-bold text-[var(--ink)]">{c.n}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{c.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* For restaurants */}
      <section id="for-restaurants" className="relative overflow-hidden bg-[var(--ink)] py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 85% 10%, rgba(216,90,48,0.18), transparent 55%)',
          }}
        />
        <div className="relative mx-auto grid max-w-[1120px] items-start gap-16 px-6 lg:grid-cols-2 lg:gap-20">
          <FadeIn>
            <p className="section-label">For partners</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-white"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Turn tonight&apos;s surplus into tonight&apos;s revenue.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/55">
              List daily leftovers in minutes. Reach hungry neighbors. Keep 100% of every sale.
            </p>

            <div className="mt-10 space-y-6">
              {[
                {
                  t: 'Live in minutes',
                  d: 'Name the bag, set price and pickup window — customers see it immediately.',
                },
                {
                  t: 'Keep every rupee',
                  d: 'Zero commission. One flat monthly fee sized to your kitchen.',
                },
                {
                  t: '30 days free',
                  d: 'No card required to start. Cancel anytime during trial.',
                },
              ].map((b) => (
                <div key={b.t} className="border-l-2 border-[var(--primary)] pl-5">
                  <p className="font-display text-lg font-semibold text-white">{b.t}</p>
                  <p className="mt-1 text-sm text-white/45">{b.d}</p>
                </div>
              ))}
            </div>

            <ContactTrialCta className="btn-primary mt-10 text-[15px]">
              Start free trial
            </ContactTrialCta>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="space-y-3">
              {[
                {
                  tier: 'Small',
                  price: 'NPR 800',
                  desc: 'Café, dhaba, home bakery',
                  features: ['Up to 5 bags / day', 'QR pickup', 'Email support'],
                  popular: false,
                },
                {
                  tier: 'Medium',
                  price: 'NPR 1,800',
                  desc: 'Restaurant, bakery, café',
                  features: ['Unlimited bags', 'Analytics', 'Priority support'],
                  popular: true,
                },
                {
                  tier: 'Large',
                  price: 'NPR 3,500',
                  desc: 'Hotel, mart, multi-branch',
                  features: ['Multi-branch', 'Featured placement', 'Dedicated support'],
                  popular: false,
                },
              ].map((plan) => (
                <div
                  key={plan.tier}
                  className={`rounded-2xl p-6 transition duration-300 ${
                    plan.popular
                      ? 'border border-[var(--primary)] bg-[#1c1c1c] shadow-[0_0_0_1px_rgba(216,90,48,0.25),0_20px_50px_rgba(216,90,48,0.12)]'
                      : 'border border-white/10 bg-[#191919] hover:border-white/18'
                  }`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-white">
                        {plan.tier}
                        {plan.popular ? (
                          <span className="ml-2 rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">
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

      {/* Download */}
      <section id="download" className="relative overflow-hidden bg-[var(--primary)] py-24 md:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.28), transparent 50%), radial-gradient(ellipse at 90% 90%, rgba(0,0,0,0.15), transparent 45%)',
          }}
        />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <FadeIn>
            <h2
              className="font-display font-bold tracking-tight text-white"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Your next meal is waiting.
            </h2>
            <p className="mt-5 text-lg text-white/75">
              Free to use. Free to reserve. Pay only when you pick up.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-full bg-[var(--ink)] px-6 py-3.5 text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:bg-black">
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
                className="flex items-center gap-3 rounded-full bg-[var(--ink)] px-6 py-3.5 text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:bg-black">
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
              className="mt-3 inline-block text-sm text-white/70 underline-offset-4 transition hover:text-white hover:underline">
              Notify me when it launches
            </a>

            <div className="mt-12 border-t border-white/15 pt-8">
              <p className="text-sm text-white/65">Talk to us</p>
              <a
                href="tel:+9779716318840"
                className="mt-2 inline-block font-display text-2xl font-bold text-white transition hover:text-white/85">
                9716318840
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
              className="mt-5 font-display font-bold tracking-tight text-[var(--ink)]"
              style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)' }}>
              Questions, answered
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
