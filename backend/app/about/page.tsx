import Link from 'next/link';

import { FadeIn } from '@/components/FadeIn';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <section className="grain relative overflow-hidden pb-20 pt-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d85a30] via-[#993c1d] to-[#4a1f10]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15),transparent_45%)]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <FadeIn delay={0}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">About</p>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-tight text-white md:text-6xl">
              LastBag
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-white/80">
              Rescue surplus food. Save money. Reduce waste — built for Nepal.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            The problem we&apos;re solving
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
            Every day in Nepal, restaurants, cafés, bakeries, and marts throw away perfectly good food
            — surplus meals, unsold pastries, and end-of-day stock that never gets sold. That&apos;s
            lost revenue for businesses and unnecessary waste for the planet.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
            At the same time, people nearby would happily buy that food at a fair discount — if they
            only knew it was available.
          </p>
        </div>
      </section>

      <section className="bg-[var(--bg)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            What LastBag does
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-relaxed text-[var(--text-secondary)]">
            LastBag connects businesses with surplus food to customers who want to save money and
            waste less — with zero commission on every sale.
          </p>

          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
            <div className="bg-[var(--surface)] p-8 md:p-10">
              <h3 className="font-display text-xl font-bold text-[var(--ink)]">For customers</h3>
              <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
                Browse rescue bags nearby. Reserve for free, choose takeaway or dine-in when offered,
                pick up during the window, and pay at the counter — cash, eSewa, or Khalti.
              </p>
            </div>
            <div className="bg-[var(--surface)] p-8 md:p-10">
              <h3 className="font-display text-xl font-bold text-[var(--ink)]">For partners</h3>
              <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
                List surplus in minutes. Get notified on every reservation. Confirm pickup with QR.
                Keep 100% of each sale on a flat monthly plan after a 30-day free trial.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            Our mission
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-relaxed text-[var(--text-secondary)]">
            Make food rescue normal in Nepal — better for restaurant margins, better for customers,
            and better for the planet.
          </p>

          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Reduce waste',
                desc: 'Keep good food out of the bin by making surplus easy to find and pick up.',
              },
              {
                title: 'Fair pricing',
                desc: 'Customers save 50–70%. Partners earn from food that would otherwise be discarded.',
              },
              {
                title: 'Built for Nepal',
                desc: 'Local payments, local cities, and flows designed for how Nepal eats out.',
              },
              {
                title: 'Simple & honest',
                desc: 'No hidden commissions. Clear orders. Transparent pricing and real impact.',
              },
            ].map((item) => (
              <div key={item.title}>
                <div className="h-px w-10 bg-[var(--primary)]" />
                <h3 className="mt-5 font-display text-lg font-bold text-[var(--ink)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg)] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-3xl font-bold text-[var(--ink)]">What is a rescue bag?</h2>
          <p className="mt-6 leading-relaxed text-[var(--text-secondary)]">
            A rescue bag is a discounted bag of surplus food from a partner business. You don&apos;t
            always know exactly what&apos;s inside — partners describe the general contents, and the
            surprise is part of the experience.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
            LastBag is a reservation platform. We don&apos;t prepare, handle, or deliver food. Partners
            are responsible for quality and safety. Customers reserve in the app and pay directly at
            pickup.
          </p>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--ink)]">Where we&apos;re launching</h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
            LastBag is rolling out across Nepal, starting with Kathmandu and expanding city by city.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {[
              { name: 'Kathmandu', np: 'काठमाडौं', status: 'First city' },
              { name: 'Lalitpur', np: 'ललितपुर', status: 'Coming soon' },
              { name: 'Pokhara', np: 'पोखरा', status: 'Coming soon' },
              { name: 'Bharatpur', np: 'भरतपुर', status: 'Coming soon' },
            ].map((city) => (
              <div
                key={city.name}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-5 py-6">
                <p className="font-display text-xl font-bold text-[var(--ink)]">{city.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{city.np}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  {city.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Join the food rescue movement
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/65">
            Whether you want to save on meals or list surplus from your business, LastBag is ready.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/#download"
              className="inline-flex justify-center rounded-full bg-white px-8 py-3.5 font-semibold text-[var(--primary)] transition hover:bg-[#fff7f3]">
              Download the app
            </Link>
            <Link
              href="/for-restaurants"
              className="inline-flex justify-center rounded-full border border-white/25 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10">
              Partner with us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
