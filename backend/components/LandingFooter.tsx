'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function LandingFooter() {
  const pathname = usePathname();
  const shouldShow = !pathname.startsWith('/admin');

  if (!shouldShow) return null;

  return (
    <footer className="relative overflow-hidden bg-[#0F0F0F]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 20% 0%, rgba(216,90,48,0.12), transparent 60%)',
        }}
      />
      <div className="relative mx-auto max-w-[1120px] px-6 pb-12 pt-20">
        <div className="border-b border-white/10 pb-14">
          <div className="mb-3 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lastbag-icon.svg"
              width={32}
              height={32}
              alt="LastBag"
              className="rounded-lg"
            />
            <span className="text-lg font-black tracking-tight text-white">
              Last<span className="text-[#D85A30]">Bag</span>
            </span>
          </div>
          <p className="text-sm text-white/40">Rescue food. Save money.</p>
          <p className="mt-1 text-xs text-white/25">Mamata Technologies · Nepal 🇳🇵</p>
        </div>

        <div className="grid grid-cols-2 gap-10 py-12 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
              Customers
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/50">
              <a className="block transition hover:text-white" href="/#how-it-works">
                How it works
              </a>
              <a className="block transition hover:text-white" href="/#cities">
                Cities
              </a>
              <a className="block transition hover:text-white" href="/#download">
                Download the app
              </a>
              <a className="block transition hover:text-white" href="/#faq">
                FAQ
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
              Restaurants
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/50">
              <Link className="block transition hover:text-white" href="/for-restaurants">
                Partner signup
              </Link>
              <a className="block transition hover:text-white" href="/for-restaurants#pricing">
                Pricing
              </a>
              <a className="block transition hover:text-white" href="/for-restaurants#faq">
                Partner FAQ
              </a>
              <a className="block transition hover:text-white" href="tel:+9779762623241">
                Call 9762623241
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
              Company
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/50">
              <Link className="block transition hover:text-white" href="/about">
                About
              </Link>
              <Link className="block transition hover:text-white" href="/legal/privacy">
                Privacy
              </Link>
              <Link className="block transition hover:text-white" href="/legal/terms">
                Terms
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
              Contact
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/50">
              <a className="block transition hover:text-white" href="mailto:hello@lastbag.app">
                hello@lastbag.app
              </a>
              <a className="block transition hover:text-white" href="tel:+9779762623241">
                9762623241
              </a>
              <p className="pt-2 text-white/35">Kathmandu, Nepal</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-white/30">© 2026 LastBag · Mamata Technologies</p>
          <p className="text-xs text-white/30">Made with ❤️ in Nepal 🇳🇵</p>
        </div>
      </div>
    </footer>
  );
}
