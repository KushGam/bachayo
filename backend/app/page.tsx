import Link from 'next/link';

import { FadeIn } from '@/components/FadeIn';
import { FaqAccordion } from '@/components/FaqAccordion';
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

function SocialProofTicker() {
  const items = [
    ['🍛 Thakali Kitchen', 'Thamel'],
    ['☕ Coffee Pasal', 'Lazimpat'],
    ['🥐 Lalitpur Bakehouse', 'Patan'],
    ['🏨 Hotel Himalaya', 'Kupondole'],
    ['🛒 Fresh Mart', 'Baneshwor'],
    ['🍛 Bhojan Griha', 'Durbarmarg'],
  ] as const;

  return (
    <section className="bg-white border-y border-[#F0EDE8] py-4 overflow-hidden">
      <div className="text-center text-xs uppercase tracking-widest text-[#9CA3AF] font-medium">
        Restaurants joining Bachayo
      </div>
      <div className="mt-3 whitespace-nowrap">
        <div className="marquee-track inline-flex min-w-[200%]">
          {[...items, ...items].map(([name, location], idx) => (
            <div key={`${name}-${idx}`} className="mx-6 inline-flex items-center text-sm font-medium text-[#6B7280]">
              <span>{name}</span>
              <span className="mx-2 text-[#D85A30]">·</span>
              <span>{location}</span>
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
            <div className="rounded-xl bg-white p-3 shadow-sm">🛍 New reservation! Kushal · Dal Bhat</div>
            <div className="rounded-xl bg-white p-3 shadow-sm">⭐ New review! 5 stars from Priya</div>
            <div className="rounded-xl bg-white p-3 shadow-sm">⏰ Pickup reminder sent to 3 customers</div>
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

function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        'I used to throw away dal bhat every night. With Bachayo, I list it in 2 minutes and customers pick it up. Zero waste, extra income.',
      initials: 'KG',
      name: 'Thakali Kitchen, Thamel',
      role: 'Restaurant partner',
    },
    {
      quote:
        'Got a full meal for Rs150 instead of Rs500. The bag was packed generously and the food was delicious. Will definitely use again!',
      initials: 'PS',
      name: 'Customer, Kathmandu',
      role: 'Beta user',
    },
    {
      quote:
        'Simple to set up, easy for my staff to use. The QR scan takes 5 seconds. Best part - I keep everything I earn.',
      initials: 'RB',
      name: 'Himalayan Bakery, Lalitpur',
      role: 'Restaurant owner',
    },
  ];

  return (
    <section className="bg-[#F5F3EF] py-24">
      <h2 className="text-4xl font-bold text-center">What people are saying</h2>
      <p className="text-[#9CA3AF] text-sm text-center mt-2">Early feedback from our beta users</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto px-6">
        {testimonials.map((item) => (
          <div key={item.name} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-[#D85A30] text-lg">★★★★★</div>
            <p className="mt-4 text-base italic leading-relaxed text-[#1A1A1A]">{item.quote}</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#FAECE7] text-[#D85A30] font-bold text-sm flex items-center justify-center">
                {item.initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1A1A1A]">{item.name}</div>
                <div className="text-xs text-[#6B7280]">{item.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    ['Revenue from surplus', '❌', '⚠️ (after commission)', '✅ Full price'],
    ['Commission per sale', '-', '15-30%', '✅ Zero'],
    ['Setup time', '-', 'Days', '✅ 5 minutes'],
    ['Works without internet', '-', '❌', '✅ QR works offline'],
    ['Nepal payment methods', '-', '❌', '✅ Cash, eSewa, Khalti'],
    ['Customer notifications', '-', '❌', '✅ Instant push'],
    ['Free trial', '-', '❌', '✅ 30 days'],
  ];

  return (
    <section className="bg-white py-24">
      <h2 className="text-4xl font-bold text-center">Why Bachayo?</h2>
      <div className="max-w-3xl mx-auto mt-12 px-6 overflow-x-auto hide-scrollbar">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#F0EDE8]">
          <thead>
            <tr className="bg-[#F5F3EF] text-sm">
              <th className="py-4 px-6 text-left"> </th>
              <th className="py-4 px-6 text-center">Throwing away</th>
              <th className="py-4 px-6 text-center">Discount apps</th>
              <th className="py-4 px-6 text-center bg-[#D85A30] text-white font-bold rounded-t-2xl">Bachayo ✓</th>
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
      a: 'A rescue bag is a discounted bag of surplus food from a restaurant, cafe, bakery, or mart that would otherwise go to waste.',
    },
    {
      id: 'pay',
      q: 'Do I pay in the app?',
      a: 'No - you reserve in the app and pay at pickup using cash, eSewa, or Khalti based on partner preference.',
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <section className="relative min-h-screen bg-gradient-to-br from-[#D85A30] via-[#993C1D] to-[#712B13] pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(250,236,215,0.16),transparent_40%)]" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <FadeIn delay={0}>
            <h1 className="mt-4 text-5xl md:text-6xl font-bold text-white leading-tight">
              Rescue great food.
              <br />
              Save up to 70%.
            </h1>
            <p className="mt-6 text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Find surplus rescue bags from your favourite restaurants, cafes, and bakeries at a
              fraction of the price.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#download"
                className="inline-flex items-center justify-center bg-white text-[#D85A30] px-8 py-4 rounded-full text-base font-bold hover:bg-[#FAECE7] transition shadow-lg">
                Download the app
              </a>
              <Link
                href="/for-restaurants"
                className="inline-flex items-center justify-center border-2 border-white/40 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/10 transition">
                I run a restaurant
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <SocialProofTicker />

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
      <TestimonialsSection />

      <section id="impact" className="bg-[#D85A30] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white text-3xl font-bold text-center">Every bag rescued makes a difference</h2>
          <LiveImpactStats />
          <div className="text-white/50 text-xs text-center mt-8">Numbers update as Bachayo grows 🌱</div>
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
            Join Bachayo as a restaurant partner with a 30-day free trial.
          </p>
          <Link
            href="/for-restaurants"
            className="inline-block bg-[#D85A30] text-white px-10 py-4 rounded-full text-lg font-bold mt-10 transition hover:bg-[#993C1D]">
            Start free trial
          </Link>
        </div>
      </section>

      <section id="download" className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold">Download Bachayo</h2>
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

