import Link from 'next/link';

import { FadeIn } from '@/components/FadeIn';
import { AnimatedCountUp } from '@/components/AnimatedCountUp';
import { FaqAccordion } from '@/components/FaqAccordion';

function AppStoreButton() {
  return (
    <a
      href="#"
      className="group flex items-center justify-center gap-3 rounded-2xl bg-[#1A1A1A] px-8 py-4 text-white transition hover:bg-[#374151]">
      <span className="flex items-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M17.9 15.2c-1.1.6-1.8 2-1.6 3.3.1.8.5 1.5 1 2-1 .6-2.2.6-3.3 0-1.2-.6-2-1.7-2.3-3-.4-1.8.2-3.7 1.4-4.8 1.1-1 2.6-1.3 3.9-.8.8.3 1.5.9 1.9 1.6-.6.5-1.1.9-1 1.7Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M18.5 5.8c-1.1.1-2.4.8-3.2 1.7-.8.9-1.2 2.2-1 3.4 1.1.2 2.4-.5 3.2-1.4.9-1 1.3-2.2 1-3.7Z"
            fill="white"
            opacity="0.75"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-xs text-white/70 transition group-hover:text-white/80">Download on the</span>
        <span className="text-lg font-bold">App Store</span>
      </span>
    </a>
  );
}

function GooglePlayButton() {
  return (
    <a
      href="#"
      className="group flex items-center justify-center gap-3 rounded-2xl bg-[#1A1A1A] px-8 py-4 text-white transition hover:bg-[#374151]">
      <span className="flex items-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4.5 2.7 20 12 4.5 21.3V2.7Z"
            fill="#FFFFFF"
            opacity="0.9"
          />
          <path
            d="M10.2 12 20 7.2"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-xs text-white/70 transition group-hover:text-white/80">Get it on</span>
        <span className="text-lg font-bold">Google Play</span>
      </span>
    </a>
  );
}

function PhoneMockup() {
  return (
    <div className="relative hidden md:block">
      <div className="absolute -top-4 -right-10 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur">
        Live in your pocket
      </div>

      <div className="relative w-[380px] h-[680px] rounded-[40px] border border-white/20 bg-white/10 backdrop-blur shadow-2xl overflow-hidden">
        <div className="h-28 px-6 pt-6 bg-[#FAECE7] rounded-t-[40px] flex items-center">
          <div>
            <div className="text-sm font-semibold text-[#993C1D]">Good morning 👋</div>
            <div className="text-xs text-[#993C1D]/80">Kathmandu · Today</div>
          </div>
        </div>

        <div className="p-6 pt-5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#D85A30]">🍽 Restaurant</span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#D85A30]">🥐 Bakery</span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#1A1A1A]">Dal Bhat</div>
                <div className="rounded-full bg-[#FAECE7] px-3 py-1 text-xs font-bold text-[#D85A30]">₨150</div>
              </div>
              <div className="mt-2 text-xs text-[#6B7280]">Thakali Kitchen · 7–8pm</div>
              <div className="mt-3 text-[11px] text-[#6B7280]">Reserve for free</div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#1A1A1A]">Bakery Mix</div>
                <div className="rounded-full bg-[#FAECE7] px-3 py-1 text-xs font-bold text-[#D85A30]">₨200</div>
              </div>
              <div className="mt-2 text-xs text-[#6B7280]">Lalitpur Bakehouse · 8–9pm</div>
              <div className="mt-3 text-[11px] text-[#6B7280]">Pickup & pay at counter</div>
            </div>
          </div>
        </div>

        {/* floating cards */}
        <div className="absolute top-6 -right-2 w-[240px] rotate-[6deg]">
          <div className="rounded-2xl bg-white shadow-lg p-3 border border-gray-100">
            <div className="text-xs font-semibold text-[#D85A30]">🛍 New bag nearby!</div>
            <div className="mt-2 text-sm font-semibold text-[#1A1A1A]">Thakali Kitchen · ₨ 150</div>
          </div>
        </div>

        <div className="absolute bottom-20 -left-4 w-[240px] rotate-[-6deg]">
          <div className="rounded-2xl bg-[#10B981] shadow-lg p-3 border border-white/20">
            <div className="text-white text-sm font-semibold">✓ Picked up!</div>
            <div className="mt-1 text-white/90 text-sm">You saved ₨ 350 today 🎉</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeLanding() {
  const faqItems = [
    {
      id: 'bag',
      q: 'What is a rescue bag?',
      a: 'A rescue bag is a discounted bag of surplus food from a restaurant, cafe, bakery, or mart that would otherwise go to waste. You don’t know exactly what’s inside — that’s part of the fun!',
    },
    {
      id: 'save',
      q: 'How much do I save?',
      a: 'Typically 50–70% off the original price. A meal that costs ₨ 500 normally might be available as a rescue bag for just ₨ 150–200.',
    },
    {
      id: 'pay',
      q: 'Do I pay in the app?',
      a: 'No — Bachayo is completely free to use. You reserve your bag for free and pay at the counter when you pick it up. Cash, eSewa, or Khalti — whatever the restaurant accepts.',
    },
    {
      id: 'cancel',
      q: 'Can I cancel a reservation?',
      a: 'Yes, you can cancel for free up to 1 hour before the pickup window starts.',
    },
    {
      id: 'city',
      q: 'Is Bachayo available in my city?',
      a: 'We’re launching in Kathmandu first, with Lalitpur, Pokhara, and Bharatpur following soon after.',
    },
    {
      id: 'partner',
      q: 'I run a restaurant. How do I join?',
      a: 'Visit our restaurant partner page and sign up for a free 30-day trial. No payment required to get started.',
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* HERO */}
      <section className="relative min-h-screen bg-gradient-to-br from-[#D85A30] via-[#993C1D] to-[#712B13] pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(250,236,215,0.16),transparent_40%)]" />

        <div className="relative max-w-6xl mx-auto px-6 grid gap-12 items-center lg:grid-cols-2">
          <FadeIn delay={0}>
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur">
              🇳🇵 Launching in Nepal
            </div>

            <h1 className="mt-4 text-5xl md:text-6xl font-bold text-white leading-tight">
              Rescue great food.
              <br />
              Save up to 70%.
            </h1>

            <p className="mt-6 text-xl text-white/80 max-w-lg leading-relaxed">
              Find surplus rescue bags from your favourite restaurants, cafes, and bakeries — at a
              fraction of the price. Good for your wallet, great for the planet.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="#download"
                className="inline-flex items-center justify-center bg-white text-[#D85A30] px-8 py-4 rounded-full text-base font-bold hover:bg-[#FAECE7] transition shadow-lg">
                Download the app →
              </a>
              <Link
                href="/for-restaurants"
                className="inline-flex items-center justify-center border-2 border-white/40 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/10 transition">
                I run a restaurant →
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-6 text-white/80">
              <div className="flex-1 flex items-center gap-6">
                <div className="border-r border-white/20 pr-6">
                  <div className="text-white font-bold text-2xl">4</div>
                  <div className="text-xs text-white/70 mt-1">cities</div>
                </div>
                <div className="border-r border-white/20 pr-6">
                  <div className="text-white font-bold text-2xl">50%–70%</div>
                  <div className="text-xs text-white/70 mt-1">off</div>
                </div>
                <div>
                  <div className="text-white font-bold text-2xl">Zero waste</div>
                  <div className="text-xs text-white/70 mt-1">impact</div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <PhoneMockup />
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#F5F3EF] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-[#D85A30] font-semibold text-sm uppercase tracking-widest text-center">
            How it works
          </div>
          <h2 className="text-4xl font-bold text-center text-[#1A1A1A] mt-3">
            Rescue food in 3 simple steps
          </h2>

          <div className="relative mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  n: '1',
                  e: '🔍',
                  t: 'Browse nearby',
                  d: 'Find rescue bags from restaurants, cafes, bakeries and more near you',
                },
                {
                  n: '2',
                  e: '📱',
                  t: 'Reserve for free',
                  d: 'Reserve your bag in seconds. No upfront payment needed — it’s completely free to reserve',
                },
                {
                  n: '3',
                  e: '🛍',
                  t: 'Pick up & pay',
                  d: 'Head to the restaurant during the pickup window and pay at the counter. Enjoy!',
                },
              ].map((s, idx) => (
                <FadeIn key={s.n} delay={idx * 120}>
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
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

            <div className="hidden md:block absolute left-[33%] top-10 text-[#D85A30] text-4xl font-bold select-none">
              →
            </div>
            <div className="hidden md:block absolute left-[67%] top-10 text-[#D85A30] text-4xl font-bold select-none">
              →
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATS / IMPACT */}
      <section id="impact" className="bg-[#D85A30] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white text-3xl font-bold text-center">Every bag rescued makes a difference</h2>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 0, suffix: '+', label: 'Restaurants onboarded' },
              { value: 70, suffix: '%', label: 'Average savings per bag' },
              { value: 4, suffix: '', label: 'Cities at launch' },
              { value: 0, suffix: ' kg', label: 'Food rescued so far' },
            ].map((stat, idx) => (
              <div key={stat.label} className="text-center">
                <div className="text-5xl font-bold text-white">
                  <AnimatedCountUp target={stat.value} suffix={stat.suffix} delay={idx * 80} />
                </div>
                <div className="text-white/70 text-sm mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="text-white/50 text-xs text-center mt-8">Numbers update as Bachayo grows 🌱</div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center">Rescue bags from every type of business</h2>

          <div className="mt-12 grid grid-cols-2 lg:grid-cols-5 gap-4 justify-items-stretch">
            {[
              { e: '🍛', name: 'Restaurant', d: 'Dal bhat, thali sets & more' },
              { e: '☕', name: 'Cafe', d: 'Coffee, snacks & pastries' },
              { e: '🥐', name: 'Bakery', d: 'Fresh bread, rolls & bakes' },
              { e: '🛒', name: 'Mart', d: 'Produce & grocery items' },
              { e: '🏨', name: 'Hotel', d: 'Buffet & breakfast surplus' },
            ].map((c) => (
              <div
                key={c.name}
                className="bg-[#F5F3EF] rounded-2xl p-6 text-center border border-transparent hover:border-[#D85A30] hover:bg-[#FAECE7] transition-all cursor-default">
                <div className="text-4xl">{c.e}</div>
                <div className="font-semibold text-[#1A1A1A] mt-3 text-sm">{c.name}</div>
                <div className="text-[#6B7280] text-xs mt-1">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CITIES */}
      <section id="cities" className="bg-[#F5F3EF] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center">Launching across Nepal</h2>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { pin: '📍', name: 'Kathmandu', np: 'काठमाडौं', status: 'Launching first' },
              { pin: '📍', name: 'Lalitpur', np: 'ललितपुर', status: 'Launching soon' },
              { pin: '📍', name: 'Pokhara', np: 'पोखरा', status: 'Launching soon' },
              { pin: '📍', name: 'Bharatpur', np: 'भरतपुर', status: 'Launching soon' },
            ].map((city) => (
              <div key={city.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl text-[#D85A30]">{city.pin}</div>
                <div className="text-xl font-bold mt-3">{city.name}</div>
                <div className="text-[#6B7280] text-sm mt-1">{city.np}</div>
                <div className="inline-block rounded-full text-xs px-3 py-1 mt-3 bg-[#FAECE7] text-[#993C1D]">
                  {city.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR RESTAURANTS CTA */}
      <section className="bg-[#1A1A1A] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs rounded-full px-3 py-1">
            🏪 Restaurant owners
          </div>
          <h2 className="text-4xl font-bold text-white mt-4">Turn surplus food into revenue</h2>
          <p className="text-white/70 text-lg mt-4 max-w-2xl mx-auto">
            Join Bachayo as a restaurant partner. List your daily surplus in 2 minutes, reach hundreds of nearby customers,
            and reduce food waste — all with a 30-day free trial.
          </p>

          <div className="mt-12 text-left max-w-lg mx-auto">
            {[
              'List a rescue bag in under 2 minutes',
              'Get notified instantly when customers reserve',
              '30-day free trial — no card required to start',
            ].map((t) => (
              <div key={t} className="flex items-center gap-4 mb-4">
                <div className="w-8 h-8 bg-[#D85A30] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <div className="text-white text-base">{t}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            {[
              { label: 'Small', txt: 'NPR 800/mo · Small business', active: false },
              { label: 'Medium', txt: 'NPR 1,800/mo · Restaurant', active: true },
              { label: 'Large', txt: 'NPR 3,500/mo · Hotel & mart', active: false },
            ].map((p) => (
              <div
                key={p.label}
                className={`rounded-2xl px-6 py-4 text-center border ${p.active ? 'bg-[#D85A30] border-[#D85A30]' : 'bg-white/10 border-white/20'}`}>
                <div className="text-white text-sm font-semibold">{p.txt}</div>
              </div>
            ))}
          </div>

          <Link
            href="/for-restaurants"
            className="inline-block bg-[#D85A30] text-white px-10 py-4 rounded-full text-lg font-bold mt-10 transition hover:bg-[#993C1D]">
            Start free trial →
          </Link>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section id="download" className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold">Download Bachayo</h2>
          <p className="text-[#6B7280] text-lg mt-4">
            Free to download. Free to reserve. Pay only at pickup.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <AppStoreButton />
            <GooglePlayButton />
          </div>

          <div className="text-[#9CA3AF] text-sm mt-4">
            iOS and Android — launching in Kathmandu first
          </div>

          <div className="hidden md:flex mt-10 flex-col items-center gap-3">
            <div className="rounded-xl border border-gray-100 bg-[#F5F3EF] p-4">
              {/* simple QR placeholder */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div
                    key={i}
                    className={(i * 17) % 7 < 2 ? 'w-3 h-3 bg-[#1A1A1A]' : 'w-3 h-3 bg-transparent border border-gray-200'}
                  />
                ))}
              </div>
            </div>
            <div className="text-sm text-[#9CA3AF]">Scan to download</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#F5F3EF] py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center">Common questions</h2>
          <div className="mt-12">
            <FaqAccordion items={faqItems.map((x) => ({ id: x.id, q: x.q, a: x.a }))} />
          </div>
        </div>
      </section>

    </main>
  );
}

