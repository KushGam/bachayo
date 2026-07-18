import Link from 'next/link';

import { ContactTrialCta } from '@/components/ContactTrialCta';
import { FadeIn } from '@/components/FadeIn';
import { FaqAccordion } from '@/components/FaqAccordion';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { HeroPhoneMockup } from '@/components/HeroPhoneMockup';
import { LiveImpactStats } from '@/components/LiveImpactStats';

function StoreButton({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <a
      href="#download"
      className="group flex min-w-[180px] flex-col items-start rounded-2xl bg-[var(--ink)] px-6 py-4 text-left text-white transition hover:bg-[#2a2420]">
      <span className="text-[11px] text-white/55 transition group-hover:text-white/75">{eyebrow}</span>
      <span className="mt-0.5 font-display text-lg font-bold tracking-tight">{title}</span>
    </a>
  );
}

export default function HomeLanding() {
  const faqItems = [
    {
      id: 'bag',
      q: 'What is a rescue bag?',
      a: 'A discounted surprise bag of surplus food from a restaurant, café, bakery, hotel, or mart that would otherwise go to waste. Partners describe the kind of food to expect; exact contents change day to day.',
    },
    {
      id: 'save',
      q: 'How much do I save?',
      a: 'Typically 50–70% off the original price. A meal that usually costs ₨ 500 might be available as a rescue bag for ₨ 150–200.',
    },
    {
      id: 'pay',
      q: 'Do I pay in the app?',
      a: 'No. LastBag is free to download and free to reserve. You pay at the counter when you pick up — cash, eSewa, or Khalti, depending on what the partner accepts.',
    },
    {
      id: 'cancel',
      q: 'Can I cancel a reservation?',
      a: 'Yes. Open My Bags and tap Cancel. You can cancel until 30 minutes before pickup starts. After that, cancellation is blocked so the restaurant can prepare.',
    },
    {
      id: 'service',
      q: 'Can I dine in or take away?',
      a: 'Many partners offer takeaway, dine-in, or both. When both are available, you choose before reserving — and the partner sees your choice on the order.',
    },
    {
      id: 'city',
      q: 'Is LastBag available in my city?',
      a: 'We are live-building across Kathmandu, with Lalitpur, Pokhara, and Bharatpur next. Download the app to see what’s available near you.',
    },
    {
      id: 'partner',
      q: 'I run a restaurant. How do I join?',
      a: 'Visit the restaurant partner page and start a free 30-day trial. List bags in minutes, keep 100% of each sale, and pay one flat monthly fee after trial.',
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Hero — one composition: brand, headline, support, CTAs, product visual */}
      <section className="grain relative min-h-[100svh] overflow-hidden bg-gradient-to-br from-[#d85a30] via-[#993c1d] to-[#4a1f10] pt-28 pb-20 md:pt-32 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(255,255,255,0.18),transparent_50%),radial-gradient(ellipse_at_90%_10%,rgba(250,236,215,0.16),transparent_40%)]" />
        <div className="absolute -right-40 top-24 h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-black/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <FadeIn delay={0}>
            <div className="text-center lg:text-left">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                LastBag
              </p>

              <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
                Rescue great food.
                <span className="mt-2 block text-white/85">Save up to 70%.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/75 lg:mx-0">
                Surplus rescue bags from restaurants, cafés, and bakeries near you — reserve free,
                pick up, pay at the counter.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a
                  href="#download"
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#d85a30] shadow-xl shadow-black/20 transition hover:bg-[#fff7f3]">
                  Download the app
                </a>
                <ContactTrialCta className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15">
                  Partner with us
                </ContactTrialCta>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={140}>
            <div className="flex justify-center lg:justify-end">
              <HeroPhoneMockup />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Trust strip — single job */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-5 overflow-hidden">
        <div className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Launching across Nepal
        </div>
        <div className="mt-3 whitespace-nowrap">
          <div className="marquee-track inline-flex min-w-[200%]">
            {Array.from({ length: 4 }).flatMap((_, loop) =>
              ['Kathmandu', 'Lalitpur', 'Pokhara', 'Bharatpur'].map((city) => (
                <span
                  key={`${city}-${loop}`}
                  className="mx-10 inline-flex items-center text-sm font-medium text-[var(--text-secondary)]">
                  {city}
                </span>
              )),
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[var(--bg)] py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              How it works
            </p>
            <h2 className="mt-3 text-center font-display text-4xl font-bold text-[var(--ink)] md:text-5xl">
              Three steps to a better meal
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-[var(--text-secondary)]">
              No upfront payment. No complicated checkout. Just reserve, arrive, and enjoy.
            </p>
          </FadeIn>

          <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              {
                n: '01',
                title: 'Browse nearby',
                body: 'See today’s rescue bags from partners around you — with pickup windows, prices, and how many are left.',
              },
              {
                n: '02',
                title: 'Reserve for free',
                body: 'Hold your bag with your name and phone. Choose takeaway or dine-in when the partner offers both.',
              },
              {
                n: '03',
                title: 'Pick up & pay',
                body: 'Show your QR at the counter, pay how the restaurant prefers, and take home food that almost went to waste.',
              },
            ].map((step, index) => (
              <FadeIn key={step.n} delay={index * 80}>
                <div className="relative border-t border-[var(--border)] pt-8">
                  <span className="font-display text-sm font-bold tracking-[0.16em] text-[var(--primary)]">
                    {step.n}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold text-[var(--ink)]">{step.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Product story */}
      <section className="bg-[var(--surface)] py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_1.1fr]">
            <FadeIn>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Built for Nepal
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold text-[var(--ink)] md:text-5xl">
                Food rescue that fits how Nepal eats and pays
              </h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="max-w-xl text-lg leading-relaxed text-[var(--text-secondary)] lg:justify-self-end">
                LastBag is designed around local habits — cash and wallets at pickup, short evening
                windows, and partners who need a simple way to sell surplus without losing margin to
                commission apps.
              </p>
            </FadeIn>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
            {[
              {
                title: 'Reserve in seconds',
                body: 'Browse without friction. Reserve with name and phone — then manage everything in My Bags, including chat with the partner.',
              },
              {
                title: 'QR pickup that just works',
                body: 'Customers show a QR or short code. Partners confirm in one tap. Stock updates live so “X left” stays honest.',
              },
              {
                title: 'Zero commission for partners',
                body: 'Restaurants keep 100% of every sale. One flat monthly subscription after a 30-day free trial — no cut per order.',
              },
              {
                title: 'Takeaway or dine-in',
                body: 'Partners set the options. Customers choose. Orders show “Prepare: Takeaway” or “Prepare: Dine-in” so the kitchen knows what to do.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-[var(--surface)] p-8 md:p-10">
                <h3 className="font-display text-xl font-bold text-[var(--ink)]">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section id="about" className="bg-[var(--bg)] py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Why LastBag exists
            </p>
            <h2 className="mt-3 text-center font-display text-4xl font-bold text-[var(--ink)] md:text-5xl">
              Good food shouldn&apos;t end in the bin
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-[var(--text-secondary)]">
              Every evening, kitchens have surplus that never gets sold. Nearby people would buy it
              at a fair discount — if they knew. LastBag closes that gap.
            </p>
          </FadeIn>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                title: 'Less waste',
                body: 'Meals, pastries, and groceries find a home instead of becoming landfill.',
              },
              {
                title: 'Real savings',
                body: 'Customers save 50–70%. Partners earn from food they would have discarded.',
              },
              {
                title: 'Fair for kitchens',
                body: 'No commission games. Flat pricing, clear orders, and tools built for busy service.',
              },
            ].map((item, index) => (
              <FadeIn key={item.title} delay={index * 70}>
                <div>
                  <div className="h-px w-12 bg-[var(--primary)]" />
                  <h3 className="mt-6 font-display text-2xl font-bold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="grain relative overflow-hidden bg-gradient-to-br from-[#d85a30] to-[#712b13] py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">
            Every bag rescued makes a difference
          </h2>
          <LiveImpactStats />
          <p className="mt-8 text-center text-xs text-white/50">Live totals as LastBag grows</p>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="bg-[var(--surface)] py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Cities
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold text-[var(--ink)] md:text-5xl">
                Starting where Nepal eats out
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-[var(--text-secondary)]">
                We&apos;re opening city by city with restaurants, cafés, bakeries, hotels, and marts
                that want surplus to mean revenue — not waste.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {[
                { name: 'Kathmandu', np: 'काठमाडौं', note: 'First city' },
                { name: 'Lalitpur', np: 'ललितपुर', note: 'Opening soon' },
                { name: 'Pokhara', np: 'पोखरा', note: 'Opening soon' },
                { name: 'Bharatpur', np: 'भरतपुर', note: 'Opening soon' },
              ].map((city) => (
                <div
                  key={city.name}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-5 py-6">
                  <p className="font-display text-xl font-bold text-[var(--ink)]">{city.name}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{city.np}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                    {city.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-[var(--bg)] py-24 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center font-display text-4xl font-bold text-[var(--ink)] md:text-5xl">
            Why partners choose LastBag
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[var(--text-secondary)]">
            Compared with throwing food away — or apps that take a cut of every order.
          </p>

          <div className="mt-12 overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[680px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <thead>
                <tr className="bg-[var(--bg-deep)] text-left text-sm">
                  <th className="px-5 py-4 font-medium text-[var(--text-muted)]"> </th>
                  <th className="px-5 py-4 font-medium text-[var(--text-secondary)]">Throwing away</th>
                  <th className="px-5 py-4 font-medium text-[var(--text-secondary)]">Commission apps</th>
                  <th className="bg-[var(--primary)] px-5 py-4 font-semibold text-white">LastBag</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ['Revenue from surplus', 'None', 'After commission', 'Full sale price'],
                  ['Commission per sale', '—', '15–30%', 'Zero'],
                  ['Setup', '—', 'Days', 'About 5 minutes'],
                  ['Pickup', '—', 'Often complex', 'QR or short code'],
                  ['Nepal payments', '—', 'Limited', 'Cash, eSewa, Khalti'],
                  ['Trial', '—', 'Rare', '30 days free'],
                ].map((row, i) => (
                  <tr key={row[0]} className={i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--bg)]'}>
                    <td className="px-5 py-4 font-medium text-[var(--ink)]">{row[0]}</td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">{row[1]}</td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">{row[2]}</td>
                    <td className="px-5 py-4 font-semibold text-[var(--primary-dark)]">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="bg-[var(--ink)] py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary-mid)]">
            For restaurants
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold text-white md:text-5xl">
            Turn tonight&apos;s surplus into revenue
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/65">
            List a bag in minutes. Get notified on every reservation. Keep 100% of what customers
            pay — with a free 30-day trial.
          </p>
          <ContactTrialCta className="mt-10 inline-flex rounded-full bg-[var(--primary)] px-10 py-4 text-base font-semibold text-white transition hover:bg-[var(--primary-dark)]">
            Start free trial
          </ContactTrialCta>
          <div className="mt-4">
            <Link href="/for-restaurants" className="text-sm font-medium text-white/55 transition hover:text-white">
              See partner pricing and details →
            </Link>
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="bg-[var(--surface)] py-24 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold text-[var(--ink)] md:text-5xl">
            Download LastBag
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Free to download. Free to reserve. Pay only when you pick up.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <StoreButton eyebrow="Download on the" title="App Store" />
            <StoreButton eyebrow="Get it on" title="Google Play" />
          </div>
          <div className="mx-auto mt-10 max-w-sm">
            <p className="mb-3 text-sm text-[var(--text-muted)]">Or continue on the web</p>
            <GoogleSignInButton />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[var(--bg)] py-24 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center font-display text-4xl font-bold text-[var(--ink)]">
            Common questions
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-[var(--text-secondary)]">
            Straight answers for customers and partners getting started with LastBag.
          </p>
          <div className="mt-12">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>
    </main>
  );
}
