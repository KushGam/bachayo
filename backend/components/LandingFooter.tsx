'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

export function LandingFooter() {
  const pathname = usePathname();
  const shouldShow = !pathname.startsWith('/admin');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  if (!shouldShow) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'ok' : 'error');
      if (res.ok) setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer className="bg-[#0F0F0F] pb-10 pt-20">
      <div className="mx-auto mb-16 max-w-xl px-6 text-center">
        <h3 className="text-2xl font-bold text-white">
          Get notified when we launch in your city
        </h3>
        <form onSubmit={onSubmit} className="mx-auto mt-6 flex max-w-md gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 rounded-xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#D85A30] focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="whitespace-nowrap rounded-xl bg-[#D85A30] px-6 py-3 font-semibold text-white transition hover:bg-[#993C1D] disabled:opacity-60">
            {status === 'loading' ? '…' : 'Notify me'}
          </button>
        </form>
        {status === 'ok' ? (
          <p className="mt-3 text-xs text-emerald-400">You&apos;re on the list.</p>
        ) : status === 'error' ? (
          <p className="mt-3 text-xs text-red-400">Something went wrong. Try again.</p>
        ) : (
          <p className="mt-3 text-xs text-white/30">
            We&apos;ll email you when LastBag is live near you
          </p>
        )}
      </div>

      <div className="mx-auto max-w-6xl border-t border-white/8 px-6 pt-12">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          <div>
            <div className="text-lg font-bold text-white">🛍 LastBag</div>
            <p className="mt-2 text-sm text-white/40">Rescue food. Save money.</p>
            <div className="mt-6 flex gap-4">
              {['IG', 'FB', 'TT'].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-[10px] font-bold text-white/50 transition hover:bg-white/15 hover:text-white">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 font-semibold text-white">For Customers</p>
            <div className="space-y-3 text-sm text-white/40">
              <a className="block transition hover:text-white" href="/#how-it-works">
                How it works
              </a>
              <a className="block transition hover:text-white" href="/#cities">
                Browse restaurants
              </a>
              <a className="block transition hover:text-white" href="/#download">
                Download the app
              </a>
              <a className="block transition hover:text-white" href="/#faq">
                Help & support
              </a>
            </div>
          </div>

          <div>
            <p className="mb-4 font-semibold text-white">For Restaurants</p>
            <div className="space-y-3 text-sm text-white/40">
              <Link className="block transition hover:text-white" href="/for-restaurants">
                Partner signup
              </Link>
              <a className="block transition hover:text-white" href="/#for-restaurants">
                Pricing
              </a>
              <a className="block transition hover:text-white" href="/#faq">
                Restaurant FAQ
              </a>
              <a className="block transition hover:text-white" href="tel:0405290710">
                Contact us
              </a>
            </div>
          </div>

          <div>
            <p className="mb-4 font-semibold text-white">Company</p>
            <div className="space-y-3 text-sm text-white/40">
              <Link className="block transition hover:text-white" href="/about">
                About LastBag
              </Link>
              <Link className="block transition hover:text-white" href="/legal/privacy">
                Privacy policy
              </Link>
              <Link className="block transition hover:text-white" href="/legal/terms">
                Terms of service
              </Link>
              <Link className="block transition hover:text-white" href="/admin/login">
                Admin login
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 md:flex-row">
          <p className="text-xs text-white/25">© 2026 LastBag. Made with ❤️ in Nepal 🇳🇵</p>
          <div className="flex flex-wrap gap-3 text-xs text-white/25">
            <span className="inline-flex items-center gap-1">🔒 Secure</span>
            <span className="inline-flex items-center gap-1">🇳🇵 Nepal</span>
            <span className="inline-flex items-center gap-1">🌱 Zero waste</span>
            <span className="inline-flex items-center gap-1">💯 Free to use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
