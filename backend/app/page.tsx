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
      a: 'Yes! LastBag is available across Nepal. Find rescue bags near you in any city — enter your email below if you want launch updates.',
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
      {/* HERO */}
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
              <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--primary-bright)]">
                LastBag
              </p>
              <h1
                className="mt-6 font-display font-extrabold leading-[0.94] text-white"
                style={{ fontSize: 'clamp(2.75rem, 7vw, 4.75rem)' }}>
                Rescue great food.
                <span className="mt-1 block text-[var(--primary-bright)]">Save up to 70%.</span>
              </h1>
              <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-white/55 lg:mx-0">
                Surplus bags from restaurants, cafés, and bakeries near you — free to reserve, pay
                at pickup.
              </p>

              <div className="mt-11 flex flex-wrap justify-center gap-3 lg:justify-start">
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
                  <p className="text-sm font-semibold text-white">Good evening</p>
                  <p className="mt-1 text-xs text-white/65">Thamel, Kathmandu</p>
                </div>
                <div className="bg-[var(--bg)] px-4 py-4">
                  <div className="mb-3 rounded-xl bg-white px-3 py-2.5 text-xs text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
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
                      className="mb-2.5 flex items-start gap-3 rounded-2xl bg-white p-3 shadow-[var(--shadow-sm)]">
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
        <div className="mx-auto grid max-w-[1120px] grid-cols-3 divide-x divide-[var(--border)] px-6 py-10">
          {[
            { n: '4', l: 'Cities live' },
            { n: '70%', l: 'Max savings per bag' },
            { n: 'Free', l: 'To reserve a bag' },
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

      {/* Ticker */}
      <section className="overflow-hidden border-b border-[var(--border)] bg-white py-5">
        <div className="marquee-track inline-flex min-w-[200%] gap-10">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center whitespace-nowrap text-sm tracking-wide text-[var(--text-secondary)]">
              {item}
              <span className="mx-5 text-[var(--primary)]">·</span>
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
              className="mt-5 font-display font-bold tracking-tight text-[#1A1A1A]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Rescue food in three steps
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              No upfront payment. Reserve, arrive, and enjoy.
            </p>
          </div>
        </FadeIn>

        <div className="mx-auto mt-16 grid max-w-[1120px] gap-5 px-6 md:grid-cols-3">
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
              <div className="premium-card group h-full px-8 py-10 md:px-10 md:py-12">
                <p className="font-display text-sm font-semibold text-[var(--primary)]">{step.n}</p>
                <div className="mt-5 h-px w-10 bg-[var(--border)] transition group-hover:w-16 group-hover:bg-[var(--primary)]/40" />
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
              className="mt-5 font-display font-bold tracking-tight text-[var(--ink)]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Built for Nepal&apos;s food scene
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
                Browse freely. Reserve with your details — no payment until pickup.
              </p>
              <div
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: 20,
                  marginTop: 24,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid #F0EDE8',
                  transform: 'rotate(2deg)',
                }}>
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#9CA3AF',
                      marginBottom: 4,
                      fontWeight: 600,
                    }}>
                    YOUR NAME
                  </div>
                  <div
                    style={{
                      background: '#F5F3EF',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 14,
                      color: '#1A1A1A',
                    }}>
                    Kushal Gautam
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#9CA3AF',
                      marginBottom: 4,
                      fontWeight: 600,
                    }}>
                    PHONE
                  </div>
                  <div
                    style={{
                      background: '#F5F3EF',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 14,
                      color: '#1A1A1A',
                    }}>
                    +977 9762XXXXXX
                  </div>
                </div>

                <div
                  style={{
                    background: '#D85A30',
                    borderRadius: 999,
                    padding: '12px 20px',
                    textAlign: 'center',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                  Confirm reservation →
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 11,
                    color: '#9CA3AF',
                    marginTop: 8,
                  }}>
                  Free to reserve · Pay at pickup
                </div>
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
                Show your code, pay at the counter, done.
              </p>
              <div
                className="relative"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginTop: 24,
                }}>
                <div
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}>
                  <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
                    <rect x="10" y="10" width="40" height="40" rx="4" fill="#1A1A1A" />
                    <rect x="16" y="16" width="28" height="28" rx="2" fill="white" />
                    <rect x="22" y="22" width="16" height="16" rx="1" fill="#1A1A1A" />

                    <rect x="90" y="10" width="40" height="40" rx="4" fill="#1A1A1A" />
                    <rect x="96" y="16" width="28" height="28" rx="2" fill="white" />
                    <rect x="102" y="22" width="16" height="16" rx="1" fill="#1A1A1A" />

                    <rect x="10" y="90" width="40" height="40" rx="4" fill="#1A1A1A" />
                    <rect x="16" y="96" width="28" height="28" rx="2" fill="white" />
                    <rect x="22" y="102" width="16" height="16" rx="1" fill="#1A1A1A" />

                    <rect x="60" y="10" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="72" y="10" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="60" y="22" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="72" y="34" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="10" y="60" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="22" y="72" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="10" y="72" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="60" y="60" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="72" y="60" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="84" y="60" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="60" y="72" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="84" y="72" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="60" y="84" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="72" y="84" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="96" y="60" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="108" y="72" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="120" y="60" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="108" y="84" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="120" y="84" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="96" y="96" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="120" y="96" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="96" y="108" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="108" y="108" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="120" y="108" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="34" y="60" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="46" y="60" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="34" y="84" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="46" y="96" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="34" y="108" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="46" y="120" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="60" y="96" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="72" y="108" width="8" height="8" rx="1" fill="#1A1A1A" />
                    <rect x="60" y="120" width="8" height="8" rx="1" fill="#1A1A1A" />

                    <rect x="54" y="54" width="32" height="32" rx="6" fill="#D85A30" />
                    <rect x="60" y="60" width="20" height="16" rx="3" fill="white" />
                    <path
                      d="M 64,60 L 64,55 Q 64,51 70,51 Q 76,51 76,55 L 76,60"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    background: '#F5F3EF',
                    borderRadius: 10,
                    padding: '8px 20px',
                    textAlign: 'center',
                  }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#9CA3AF',
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}>
                    ORDER CODE
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: '#1A1A1A',
                      letterSpacing: 8,
                      fontFamily: 'monospace',
                    }}>
                    A3F2K9
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="min-h-[240px] rounded-[28px] border border-[var(--border)] bg-[#F5F3EF] p-9 shadow-[var(--shadow-sm)]">
              <h3 className="font-display text-2xl font-bold text-[var(--ink)]">Live updates</h3>
              <p className="mt-3 text-[15px] text-[var(--text-secondary)]">
                Partners get notified the moment a bag is reserved.
              </p>
              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    background: 'white',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                    border: '1px solid #F0EDE8',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: '#FAECE7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}>
                    🛍
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>
                      New reservation!
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      Kushal reserved 2× Dal Bhat
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>now</div>
                </div>

                <div
                  style={{
                    background: 'white',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                    border: '1px solid #F0EDE8',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    opacity: 0.85,
                  }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: '#FEF3C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}>
                    ⭐
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>
                      New 5-star review!
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      &quot;Generous bag, delicious food!&quot;
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>2m</div>
                </div>

                <div
                  style={{
                    background: 'white',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: '1px solid #F0EDE8',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    opacity: 0.65,
                  }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: '#ECFDF5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}>
                    🎉
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>
                      All bags sold out!
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      5 of 5 bags reserved today
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>5m</div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={160}>
            <div className="relative min-h-[240px] overflow-hidden rounded-[28px] bg-[var(--primary)] p-9 shadow-[var(--shadow-warm)] md:col-span-2">
              <p className="pointer-events-none absolute -bottom-4 right-4 font-display text-[7rem] font-extrabold leading-none text-white/10">
                100%
              </p>
              <h3 className="relative font-display text-2xl font-bold text-white">Zero commission</h3>
              <p className="relative mt-3 max-w-sm text-[15px] text-white/75">
                Partners keep every sale. One flat monthly fee after a free 30-day trial.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="relative overflow-hidden bg-[#D85A30] py-24 md:py-28">
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
              Every bag rescued matters
            </h2>
            <p className="mt-4 text-white/75">
              Real impact, one rescue bag at a time.
            </p>
          </div>
        </FadeIn>
        <div className="relative">
          <LiveImpactStats />
        </div>
      </section>

      {/* Categories */}
      <section className="bg-[#F5F3EF] py-24">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">Partners</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-[#1A1A1A]"
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
              <div className="rounded-2xl border border-[#E8E4DC] bg-white px-4 py-7 text-center shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#FAECE7] hover:shadow-[var(--shadow-md)]">
                <p className="font-display text-base font-bold text-[#1A1A1A]">{c.n}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{c.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* For restaurants */}
      <section id="for-restaurants" className="relative overflow-hidden bg-[#1A1A1A] py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 85% 10%, rgba(216,90,48,0.18), transparent 55%)',
          }}
        />
        <div className="relative mx-auto grid max-w-[1120px] items-start gap-16 px-6 lg:grid-cols-2 lg:gap-20">
          <FadeIn>
            <p className="section-label">For restaurants</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-white"
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
                <div key={b.t} className="border-l-2 border-[var(--primary)] pl-5">
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

      {/* Cities */}
      <section id="cities" className="bg-white py-24">
        <FadeIn>
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="section-label">Cities</p>
            <h2
              className="mt-5 font-display font-bold tracking-tight text-[#1A1A1A]"
              style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)' }}>
              Available across Nepal 🇳🇵
            </h2>
            <p className="mt-4 text-[15px] text-[var(--text-secondary)]">
              LastBag works anywhere in Nepal. Find rescue bags near you in any city.
            </p>
          </div>
        </FadeIn>

        <div className="mx-auto mt-12 grid max-w-[900px] grid-cols-2 gap-4 px-6 md:grid-cols-4">
          {[
            { name: 'Kathmandu', np: 'काठमाडौं' },
            { name: 'Lalitpur', np: 'ललितपुर' },
            { name: 'Pokhara', np: 'पोखरा' },
            { name: 'Bhaktapur', np: 'भक्तपुर' },
          ].map((city, i) => (
            <FadeIn key={city.name} delay={i * 70}>
              <div
                className="rounded-[22px] px-5 py-9 text-center transition duration-300 hover:-translate-y-0.5"
                style={{
                  background: '#FAECE7',
                  border: '1px solid #F0997B',
                  boxShadow: 'var(--shadow-md)',
                }}>
                <p className="font-display text-xl font-bold text-[#1A1A1A]">{city.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{city.np}</p>
                <span
                  className="mt-5 inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
                  style={{ background: '#10B981' }}>
                  Available now ✓
                </span>
              </div>
            </FadeIn>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-[#6B7280]">
          + Available in all cities across Nepal
        </p>
      </section>

      {/* Download */}
      <section id="download" className="relative overflow-hidden bg-[#D85A30] py-24 md:py-28">
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
              className="mt-5 font-display font-bold tracking-tight text-[#1A1A1A]"
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
