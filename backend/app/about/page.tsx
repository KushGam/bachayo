import Link from 'next/link';

import { FadeIn } from '@/components/FadeIn';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D85A30] via-[#993C1D] to-[#712B13]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15),transparent_45%)]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <FadeIn delay={0}>
            <p className="text-white/70 text-sm uppercase tracking-widest font-semibold">About us</p>
            <h1 className="mt-4 text-5xl md:text-6xl font-bold text-white leading-tight">Bachayo</h1>
            <p className="mt-6 text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              Rescue surplus food. Save money. Reduce waste — built for Nepal.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* The problem */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#1A1A1A]">The problem we&apos;re solving</h2>
          <p className="mt-6 text-[#6B7280] leading-relaxed">
            Every day in Nepal, restaurants, cafes, bakeries, and marts throw away perfectly good food
            — surplus meals, unsold pastries, and end-of-day stock that never gets sold. That&apos;s lost
            revenue for businesses and unnecessary waste for the planet.
          </p>
          <p className="mt-4 text-[#6B7280] leading-relaxed">
            At the same time, people nearby would happily buy that food at a fair discount — if they
            only knew it was available.
          </p>
        </div>
      </section>

      {/* What Bachayo does */}
      <section className="py-24 bg-[#F5F3EF]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-[#1A1A1A]">What Bachayo does</h2>
          <p className="mt-4 text-[#6B7280] text-center max-w-2xl mx-auto leading-relaxed">
            Bachayo is a food rescue platform that connects businesses with surplus food to customers
            who want to save money and reduce waste.
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="text-4xl">🛍</div>
              <h3 className="mt-4 text-xl font-bold text-[#1A1A1A]">For customers</h3>
              <p className="mt-3 text-[#6B7280] text-sm leading-relaxed">
                Browse rescue bags from nearby restaurants and shops. Reserve for free, pick up during
                the stated window, and pay at the counter — cash, eSewa, or Khalti depending on what
                the partner accepts.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="text-4xl">🏪</div>
              <h3 className="mt-4 text-xl font-bold text-[#1A1A1A]">For restaurant partners</h3>
              <p className="mt-3 text-[#6B7280] text-sm leading-relaxed">
                List your daily surplus as a rescue bag in minutes. Get notified when customers
                reserve. Confirm pickup with a QR scan. Keep 100% of every sale — one flat monthly
                subscription, zero commission per order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & values */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-[#1A1A1A]">Our mission</h2>
          <p className="mt-4 text-[#6B7280] text-center max-w-2xl mx-auto leading-relaxed">
            Make food rescue normal in Nepal — better for restaurant margins, better for customers,
            and better for the planet.
          </p>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🌱',
                title: 'Reduce waste',
                desc: 'Keep good food out of the bin by making surplus easy to find and pick up.',
              },
              {
                icon: '💰',
                title: 'Fair pricing',
                desc: 'Customers save 50–70%. Partners earn from food that would otherwise be thrown away.',
              },
              {
                icon: '🇳🇵',
                title: 'Built for Nepal',
                desc: 'Local payment methods, local cities, and a product designed for how Nepal eats.',
              },
              {
                icon: '🤝',
                title: 'Simple & honest',
                desc: 'No hidden commissions. No fake reviews. Transparent pricing and real impact.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-[#F5F3EF] p-6 text-center">
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-3 font-bold text-[#1A1A1A]">{item.title}</h3>
                <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How a rescue bag works */}
      <section className="py-24 bg-[#F5F3EF]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#1A1A1A]">What is a rescue bag?</h2>
          <p className="mt-6 text-[#6B7280] leading-relaxed">
            A rescue bag is a discounted bag of surplus food from a partner business. You don&apos;t
            always know exactly what&apos;s inside — partners describe the general contents, and the
            surprise is part of the experience.
          </p>
          <p className="mt-4 text-[#6B7280] leading-relaxed">
            Bachayo is a reservation platform. We don&apos;t prepare, handle, or deliver food. Partners
            are responsible for the quality and safety of what they sell. Customers reserve in the app
            and pay directly at pickup.
          </p>
        </div>
      </section>

      {/* Where we're launching */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[#1A1A1A]">Where we&apos;re launching</h2>
          <p className="mt-4 text-[#6B7280] max-w-xl mx-auto">
            Bachayo is rolling out across Nepal, starting with Kathmandu and expanding to more cities.
          </p>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Kathmandu', np: 'काठमाडौं', status: 'Launching first' },
              { name: 'Lalitpur', np: 'ललितपुर', status: 'Coming soon' },
              { name: 'Pokhara', np: 'पोखरा', status: 'Coming soon' },
              { name: 'Bharatpur', np: 'भरतपुर', status: 'Coming soon' },
            ].map((city) => (
              <div key={city.name} className="rounded-2xl bg-[#F5F3EF] p-6 border border-gray-100">
                <div className="text-xl font-bold">{city.name}</div>
                <div className="text-[#6B7280] text-sm mt-1">{city.np}</div>
                <div className="mt-3 inline-block rounded-full bg-[#FAECE7] text-[#993C1D] text-xs px-3 py-1 font-medium">
                  {city.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Join the food rescue movement</h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto">
            Whether you want to save on meals or list surplus from your business, Bachayo is here to
            help.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#download"
              className="inline-flex justify-center bg-white text-[#D85A30] px-8 py-4 rounded-full font-bold hover:bg-[#FAECE7] transition">
              Download the app
            </Link>
            <Link
              href="/for-restaurants"
              className="inline-flex justify-center border border-white/30 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition">
              Partner with us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
