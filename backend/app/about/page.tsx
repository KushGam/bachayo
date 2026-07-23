import Link from 'next/link';

import { FadeIn } from '@/components/FadeIn';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <section className="grain relative overflow-hidden pb-24 pt-32 md:pb-28 md:pt-36">
        <div className="absolute inset-0 bg-[var(--ink)]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 20%, rgba(216,90,48,0.28), transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <FadeIn>
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              About LastBag
            </p>
            <h1
              className="mt-5 font-display font-extrabold leading-[1.05] text-white"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>
              Rescue surplus food.
              <span className="mt-2 block text-white/70">Built for Nepal.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/55">
              We connect kitchens with leftover food to people nearby who want to save money and
              waste less.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            The problem
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
            Every day in Nepal, restaurants, cafés, bakeries, and marts throw away perfectly good
            food — surplus meals, unsold pastries, and end-of-day stock. That&apos;s lost revenue
            for businesses and unnecessary waste.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
            At the same time, people nearby would happily buy that food at a fair discount — if they
            knew it was available.
          </p>
        </div>
      </section>

      <section className="bg-[var(--bg)] py-24">
        <div className="mx-auto max-w-[1120px] px-6">
          <h2 className="text-center font-display text-3xl font-bold text-[var(--ink)] md:text-4xl">
            What LastBag does
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-relaxed text-[var(--text-secondary)]">
            A reservation platform with zero commission on sales — clear for customers, simple for
            kitchens.
          </p>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
            <div className="bg-[var(--surface)] p-8 md:p-10">
              <h3 className="font-display text-xl font-bold text-[var(--ink)]">For customers</h3>
              <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
                Browse rescue bags nearby. Reserve for free, choose takeaway or dine-in when
                offered, pick up during the window, and pay at the counter.
              </p>
            </div>
            <div className="bg-[var(--surface)] p-8 md:p-10">
              <h3 className="font-display text-xl font-bold text-[var(--ink)]">For partners</h3>
              <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
                List surplus in minutes. Get notified on every reservation. Confirm pickup with QR.
                Keep 100% of each sale on a flat monthly plan after a free trial.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-[1120px] px-6">
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
                <h3 className="mt-5 font-display text-lg font-bold text-[var(--ink)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg)] py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-3xl font-bold text-[var(--ink)]">
            What is a rescue bag?
          </h2>
          <p className="mt-6 leading-relaxed text-[var(--text-secondary)]">
            A rescue bag is a discounted bag of surplus food from a partner business. You
            don&apos;t always know exactly what&apos;s inside — partners describe the general
            contents, and the surprise is part of the experience.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
            LastBag is a reservation platform. We don&apos;t prepare, handle, or deliver food.
            Partners are responsible for quality and safety. Customers reserve in the app and pay
            directly at pickup.
          </p>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-24">
        <div className="mx-auto max-w-[900px] px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--ink)]">
            Where we&apos;re launching
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
            Rolling out across Nepal, starting with Kathmandu.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
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
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  {city.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Join the food rescue movement
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55">
            Whether you want to save on meals or list surplus from your business, LastBag is ready.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/#download" className="btn-primary bg-white !text-[var(--primary)] hover:!bg-[#fff7f3]">
              Download the app
            </Link>
            <Link href="/for-restaurants" className="btn-ghost-light">
              Partner with us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
