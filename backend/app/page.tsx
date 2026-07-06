import Link from 'next/link';

import { ContactTrialCta } from '@/components/ContactTrialCta';
import { FadeIn } from '@/components/FadeIn';
import { FaqAccordion } from '@/components/FaqAccordion';
import { HeroPhoneMockup } from '@/components/HeroPhoneMockup';
import { LiveImpactStats } from '@/components/LiveImpactStats';

function AppStoreButton() {
  return (
    <a
      href="#"
      className="group flex items-center justify-center gap-3 rounded-2xl bg-[#1A1A1A] px-8 py-4 text-white transition hover:bg-[#374151]">
      <span className="text-xs text-white/70 transition group-hover:text-white/80">Download on the</span>
      <span className="text-lg font-bold">App Store</span>
    </a>
  );
}

function GooglePlayButton() {
  return (
    <a
      href="#"
      className="group flex items-center justify-center gap-3 rounded-2xl bg-[#1A1A1A] px-8 py-4 text-white transition hover:bg-[#374151]">
      <span className="text-xs text-white/70 transition group-hover:text-white/80">Get it on</span>
      <span className="text-lg font-bold">Google Play</span>
    </a>
  );
}

function LaunchCitiesStrip() {
  const cities = ['Kathmandu', 'Lalitpur', 'Pokhara', 'Bharatpur'];

  return (
    <section className="bg-white border-y border-[#F0EDE8] py-4 overflow-hidden">
      <div className="text-center text-xs uppercase tracking-widest text-[#9CA3AF] font-medium">
        Launching across Nepal
      </div>
      <div className="mt-3 whitespace-nowrap">
        <div className="marquee-track inline-flex min-w-[200%]">
          {[...cities, ...cities, ...cities, ...cities].map((city, idx) => (
            <div key={`${city}-${idx}`} className="mx-8 inline-flex items-center text-sm font-medium text-[#6B7280]">
              <span>📍 {city}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BentoFeatures() {
  return (
    <section className="bg-white py-24">
      <div className="text-4xl font-bold text-center text-[#1A1A1A]">Everything you need to rescue food</div>
      <div className="text-[#6B7280] text-center mt-3">Built for Nepal&apos;s food scene</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-6xl mx-auto px-6">
        <div className="md:col-span-2 bg-[#FAECE7] rounded-3xl p-8 relative min-h-[280px] overflow-hidden">
          <h3 className="text-xl font-bold text-[#1A1A1A]">Reserve in seconds</h3>
          <p className="text-[#6B7280] text-sm mt-2 max-w-xs">
            No account needed to browse. Reserve a bag with just your name and phone.
          </p>
          <div className="absolute bottom-5 right-5 w-64 rotate-[-6deg] rounded-2xl bg-white p-4 shadow-lg">
            <div className="h-8 rounded-lg bg-[#F5F3EF] px-3 text-xs text-[#9CA3AF] flex items-center">Name</div>
            <div className="mt-2 h-8 rounded-lg bg-[#F5F3EF] px-3 text-xs text-[#9CA3AF] flex items-center">
              Phone
            </div>
            <div className="mt-3 rounded-lg bg-[#D85A30] py-2 text-center text-xs font-semibold text-white">
              Confirm reservation
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-3xl p-8 min-h-[280px]">
          <h3 className="text-xl font-bold text-white">QR pickup</h3>
          <p className="text-white/60 text-sm mt-2">Show your QR, pay at counter, done.</p>
          <div className="mt-6 mx-auto w-40 rounded-2xl bg-white p-3">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 49 }).map((_, index) => (
                <div key={index} className={index % 3 === 0 ? 'h-3 w-3 bg-[#1A1A1A]' : 'h-3 w-3 bg-[#F5F3EF]'} />
              ))}
            </div>
          </div>
          <div className="mt-3 text-center font-mono text-sm text-white/40">Order #A3F2</div>
        </div>

        <div className="bg-[#F5F3EF] rounded-3xl p-8 min-h-[280px]">
          <h3 className="text-xl font-bold text-[#1A1A1A]">Live notifications</h3>
          <p className="text-[#6B7280] text-sm mt-2">Partners notified instantly when someone reserves their bag.</p>
          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-white p-3 shadow-sm text-sm">🛍 New reservation received</div>
            <div className="rounded-xl bg-white p-3 shadow-sm text-sm">⭐ New review posted</div>
            <div className="rounded-xl bg-white p-3 shadow-sm text-sm">⏰ Pickup reminder sent</div>
          </div>
        </div>

        <div className="bg-[#D85A30] rounded-3xl p-8 min-h-[280px] relative overflow-hidden">
          <h3 className="text-xl font-bold text-white">Zero commission</h3>
          <p className="text-white/70 text-sm mt-2">Keep 100% of every sale. One flat monthly fee, nothing more.</p>
          <div className="absolute bottom-4 right-4 text-8xl font-black text-white/20">100%</div>
        </div>

        <div className="md:col-span-2 bg-[#F5F3EF] rounded-3xl p-8 min-h-[280px] relative overflow-hidden">
          <h3 className="text-xl font-bold text-[#1A1A1A]">Built for Nepal</h3>
          <p className="text-[#6B7280] text-sm mt-2 max-w-md">
            eSewa, Khalti, cash - customers pay how they want. Available in Kathmandu, Pokhara,
            Lalitpur and Bharatpur.
          </p>
          <svg
            viewBox="0 0 460 180"
            className="absolute bottom-4 right-4 w-72 h-28 text-[#D85A30]/60"
            fill="none"
            aria-hidden="true">
            <path
              d="M18 110C78 72 131 87 178 66C230 42 285 34 342 49C378 58 409 80 442 86L426 130C389 121 369 106 339 104C289 100 241 116 186 132C131 149 74 150 20 135Z"
              stroke="currentColor"
              strokeWidth="3"
            />
            {[{ cx: 132, cy: 100 }, { cx: 174, cy: 107 }, { cx: 232, cy: 93 }, { cx: 316, cy: 92 }].map((dot, i) => (
              <circle key={i} cx={dot.cx} cy={dot.cy} r="5" fill="#D85A30" className="animate-pulse" />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

function AboutPreviewSection() {
  return (
    <section id="about" className="bg-[#F5F3EF] py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-[#1A1A1A]">Why LastBag exists</h2>
        <p className="mt-4 text-[#6B7280] text-center max-w-2xl mx-auto leading-relaxed">
          Good food gets thrown away every day in Nepal. LastBag connects that surplus with people
          nearby who want to save money — without commissions eating into partner earnings.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🌱',
              title: 'Less waste',
              desc: 'Surplus meals, pastries, and groceries find a home instead of the bin.',
            },
            {
              icon: '💰',
              title: 'Real savings',
              desc: 'Customers get great food at 50–70% off. Partners earn from food they would have discarded.',
            },
            {
              icon: '🇳🇵',
              title: 'Made for Nepal',
              desc: 'Cash, eSewa, Khalti at pickup. Built for Kathmandu, Lalitpur, Pokhara, and Bharatpur.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="text-3xl">{item.icon}</div>
              <h3 className="mt-4 text-lg font-bold text-[#1A1A1A]">{item.title}</h3>
              <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/about"
            className="inline-flex items-center justify-center bg-[#D85A30] text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-[#993C1D] transition">
            Learn more about LastBag →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    ['Revenue from surplus', '❌', '⚠️ (after commission)', '✅ Full price'],
    ['Commission per sale', '-', '15-30%', '✅ Zero'],
    ['Setup time', '-', 'Days', '✅ 5 minutes'],
    ['Simple pickup process', '-', '❌ Complex', '✅ QR code scan'],
    ['Nepal payment methods', '-', '❌', '✅ Cash, eSewa, Khalti'],
    ['Customer notifications', '-', '❌', '✅ Instant push'],
    ['Free trial', '-', '❌', '✅ 30 days'],
  ];

  return (
    <section className="bg-white py-24">
      <h2 className="text-4xl font-bold text-center">Why LastBag?</h2>
      <div className="max-w-3xl mx-auto mt-12 px-6 overflow-x-auto hide-scrollbar">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#F0EDE8]">
          <thead>
            <tr className="bg-[#F5F3EF] text-sm">
              <th className="py-4 px-6 text-left"> </th>
              <th className="py-4 px-6 text-center">Throwing away</th>
              <th className="py-4 px-6 text-center">Discount apps</th>
              <th className="py-4 px-6 text-center bg-[#D85A30] text-white font-bold rounded-t-2xl">LastBag ✓</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row[0]} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#F5F3EF]'}>
                <td className="py-4 px-6 text-sm font-medium">{row[0]}</td>
                <td className="py-4 px-6 text-sm text-center text-[#E24B4A]">{row[1]}</td>
                <td className="py-4 px-6 text-sm text-center text-[#EF9F27]">{row[2]}</td>
                <td className="py-4 px-6 text-sm text-center text-[#10B981] font-bold">{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function HomeLanding() {
  const faqItems = [
    {
      id: 'bag',
      q: 'What is a rescue bag?',
      a: 'A rescue bag is a discounted bag of surplus food from a restaurant, cafe, bakery, or mart that would otherwise go to waste. Contents vary — partners describe what to expect, and the surprise is part of the fun.',
    },
    {
      id: 'save',
      q: 'How much do I save?',
      a: 'Typically 50–70% off the original price. A meal that costs ₨ 500 normally might be available as a rescue bag for ₨ 150–200.',
    },
    {
      id: 'pay',
      q: 'Do I pay in the app?',
      a: 'No — LastBag is free to use. You reserve your bag for free and pay at the counter when you pick up. Cash, eSewa, or Khalti — whatever the restaurant accepts.',
    },
    {
      id: 'cancel',
      q: 'Can I cancel a reservation?',
      a: 'Yes, you can cancel for free up to 1 hour before the pickup window starts.',
    },
    {
      id: 'city',
      q: 'Is LastBag available in my city?',
      a: 'We are launching in Kathmandu first, with Lalitpur, Pokhara, and Bharatpur following soon. Join the waitlist in the footer to get notified.',
    },
    {
      id: 'partner',
      q: 'I run a restaurant. How do I join?',
      a: 'Visit our restaurant partner page and sign up for a free 30-day trial. No payment required to get started.',
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D85A30] via-[#993C1D] to-[#712B13] pt-28 pb-24 md:pt-32 md:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(255,255,255,0.2),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(250,236,215,0.18),transparent_38%)]" />
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-24 bottom-10 h-80 w-80 rounded-full bg-black/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-12">
          <FadeIn delay={0}>
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                🇳🇵 First food rescue app in Nepal
              </span>

              <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
                Rescue great food.
                <br />
                Save up to 70%.
              </h1>

              <p className="mx-auto mt-6 max-w-md text-xl leading-relaxed text-white/75 lg:mx-0">
                Find surplus rescue bags from restaurants, cafes and bakeries near you — at a
                fraction of the price.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start">
                <a
                  href="#download"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-bold text-[#D85A30] shadow-xl shadow-black/20 transition hover:bg-[#FFF5F2]">
                  Download the app →
                </a>
                <ContactTrialCta className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15">
                  I run a restaurant →
                </ContactTrialCta>
              </div>

              <div className="mt-14 flex flex-wrap justify-center gap-8 lg:justify-start">
                {[
                  { value: '4', label: 'Cities' },
                  { value: '70%', label: 'Max savings' },
                  { value: 'Free', label: 'To reserve' },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className={index < 2 ? 'border-r border-white/15 pr-8' : ''}>
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <div className="mt-1 text-sm text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="flex justify-center lg:justify-end">
              <HeroPhoneMockup />
            </div>
          </FadeIn>
        </div>
      </section>

      <LaunchCitiesStrip />

      <section id="how-it-works" className="bg-[#F5F3EF] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-[#D85A30] font-semibold text-sm uppercase tracking-widest text-center">
            How it works
          </div>
          <h2 className="text-4xl font-bold text-center text-[#1A1A1A] mt-3">Rescue food in 3 simple steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {[
              { n: '1', e: '🔍', t: 'Browse nearby', d: 'Find rescue bags from partners near you.' },
              { n: '2', e: '📱', t: 'Reserve for free', d: 'Reserve in seconds with your name and phone.' },
              { n: '3', e: '🛍', t: 'Pick up & pay', d: 'Show QR, pay at counter, and enjoy.' },
            ].map((step) => (
              <div key={step.n} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAECE7] text-[#D85A30] font-bold text-xl flex items-center justify-center mx-auto">
                  {step.n}
                </div>
                <div className="text-5xl mt-6">{step.e}</div>
                <div className="text-xl font-bold mt-4 text-[#1A1A1A]">{step.t}</div>
                <p className="text-[#6B7280] mt-3 leading-relaxed text-sm">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BentoFeatures />
      <AboutPreviewSection />

      <section id="impact" className="bg-[#D85A30] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white text-3xl font-bold text-center">Every bag rescued makes a difference</h2>
          <LiveImpactStats />
          <div className="text-white/50 text-xs text-center mt-8">Numbers update as LastBag grows 🌱</div>
        </div>
      </section>

      <section id="cities" className="bg-[#F5F3EF] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center">Launching across Nepal</h2>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Kathmandu', np: 'काठमाडौं' },
              { name: 'Lalitpur', np: 'ललितपुर' },
              { name: 'Pokhara', np: 'पोखरा' },
              { name: 'Bharatpur', np: 'भरतपुर' },
            ].map((city) => (
              <div key={city.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-xl font-bold mt-3">{city.name}</div>
                <div className="text-[#6B7280] text-sm mt-1">{city.np}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ComparisonSection />

      <section className="bg-[#1A1A1A] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mt-4">Turn surplus food into revenue</h2>
          <p className="text-white/70 text-lg mt-4 max-w-2xl mx-auto">
            Join LastBag as a restaurant partner with a 30-day free trial.
          </p>
          <ContactTrialCta className="mt-10 inline-block rounded-full bg-[#D85A30] px-10 py-4 text-lg font-bold text-white transition hover:bg-[#993C1D]">
            Start free trial →
          </ContactTrialCta>
        </div>
      </section>

      <section id="download" className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold">Download LastBag</h2>
          <p className="text-[#6B7280] text-lg mt-4">Free to download. Free to reserve. Pay only at pickup.</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <AppStoreButton />
            <GooglePlayButton />
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#F5F3EF] py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center">Common questions</h2>
          <div className="mt-12">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>
    </main>
  );
}

