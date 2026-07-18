'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function LandingFooter() {
  const pathname = usePathname();
  const shouldShow = !pathname.startsWith('/admin');
  if (!shouldShow) return null;

  return (
    <footer className="bg-[var(--ink)] py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-white">
              LastBag
            </Link>
            <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-white/50">
              Rescue surplus food. Save money. Built for Nepal.
            </p>
            <div className="mt-6 flex gap-5 text-sm text-white/45">
              <a className="transition hover:text-white" href="#">
                Instagram
              </a>
              <a className="transition hover:text-white" href="#">
                Facebook
              </a>
              <a className="transition hover:text-white" href="#">
                TikTok
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Customers</p>
            <div className="mt-4 space-y-2.5">
              <a className="block text-sm text-white/50 transition hover:text-white" href="/#how-it-works">
                How it works
              </a>
              <a className="block text-sm text-white/50 transition hover:text-white" href="/#cities">
                Cities
              </a>
              <a className="block text-sm text-white/50 transition hover:text-white" href="/#download">
                Download
              </a>
              <a className="block text-sm text-white/50 transition hover:text-white" href="/#faq">
                FAQ
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Restaurants</p>
            <div className="mt-4 space-y-2.5">
              <Link className="block text-sm text-white/50 transition hover:text-white" href="/for-restaurants">
                Partner signup
              </Link>
              <Link
                className="block text-sm text-white/50 transition hover:text-white"
                href="/for-restaurants#pricing">
                Pricing
              </Link>
              <Link
                className="block text-sm text-white/50 transition hover:text-white"
                href="/for-restaurants#how-it-works">
                How it works
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Company</p>
            <div className="mt-4 space-y-2.5">
              <Link className="block text-sm text-white/50 transition hover:text-white" href="/about">
                About
              </Link>
              <Link className="block text-sm text-white/50 transition hover:text-white" href="/legal/privacy">
                Privacy
              </Link>
              <Link className="block text-sm text-white/50 transition hover:text-white" href="/legal/terms">
                Terms
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/35">© 2026 LastBag. Made in Nepal.</p>
          <p className="text-xs text-white/35">Rescue food. Save money.</p>
        </div>
      </div>
    </footer>
  );
}
