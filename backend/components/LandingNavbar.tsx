'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const HOME_SECTIONS = ['why', 'how-it-works', 'for-restaurants', 'impact'] as const;

export function LandingNavbar() {
  const pathname = usePathname();
  const shouldShow = useMemo(() => !pathname.startsWith('/admin'), [pathname]);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === '/';
  const isMarketingDarkPage =
    isHome || pathname.startsWith('/about') || pathname.startsWith('/for-restaurants');
  /** Transparent dark hero treatment — only before scroll on dark marketing pages */
  const onHero = isMarketingDarkPage && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection('');
      return;
    }

    const observers: IntersectionObserver[] = [];
    HOME_SECTIONS.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(sectionId);
        },
        { threshold: 0.28 },
      );
      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [pathname]);

  if (!shouldShow) return null;

  const linkClass = (active: boolean) =>
    `text-[13px] font-medium tracking-wide transition ${
      active
        ? onHero
          ? 'text-white'
          : 'text-[var(--ink)]'
        : onHero
          ? 'text-white/55 hover:text-white'
          : 'text-[var(--text-secondary)] hover:text-[var(--ink)]'
    }`;

  const navItems = [
    { href: isHome ? '#why' : '/#why', label: 'Why LastBag', section: 'why' },
    { href: isHome ? '#how-it-works' : '/#how-it-works', label: 'How it works', section: 'how-it-works' },
    { href: '/for-restaurants', label: 'For restaurants', section: 'for-restaurants' },
    { href: isHome ? '#impact' : '/#impact', label: 'Impact', section: 'impact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          onHero
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl'
        }`}>
        <div className="mx-auto flex h-[72px] max-w-[1120px] items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lastbag-icon.svg"
              width={36}
              height={36}
              alt="LastBag"
              className="rounded-lg"
            />
            <span
              className={`text-xl font-black tracking-tight ${
                onHero ? 'text-white' : 'text-[#1A1A1A]'
              }`}>
              Last<span className="text-[#D85A30]">Bag</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                className={linkClass(isHome && activeSection === item.section)}
                href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/for-restaurants"
              className="hidden rounded-full bg-[#D85A30] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(216,90,48,0.35)] transition hover:-translate-y-0.5 hover:bg-[#993C1D] md:inline-flex">
              For restaurants →
            </Link>

            <button
              type="button"
              className={`relative z-[60] flex h-11 w-11 items-center justify-center rounded-full border md:hidden ${
                open || !onHero
                  ? 'border-[var(--border)] bg-white text-[var(--ink)]'
                  : 'border-white/20 bg-white/10 text-white'
              }`}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}>
              <span className="relative flex h-3.5 w-4 flex-col justify-between">
                <span
                  className={`block h-[1.5px] w-full origin-center rounded-full bg-current transition duration-300 ${
                    open ? 'translate-y-[6px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`block h-[1.5px] w-full rounded-full bg-current transition duration-300 ${
                    open ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block h-[1.5px] w-full origin-center rounded-full bg-current transition duration-300 ${
                    open ? '-translate-y-[6px] -rotate-45' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className="md:hidden" aria-hidden={!open}>
        <button
          type="button"
          aria-label="Close menu"
          className={`fixed inset-0 z-[55] bg-black/50 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setOpen(false)}
        />

        <aside
          className={`fixed right-0 top-0 z-[56] flex h-[100dvh] w-[min(100%,20rem)] flex-col bg-[var(--surface)] shadow-2xl transition-transform duration-300 ease-out ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}>
          <div className="flex h-[72px] items-center justify-between border-b border-[var(--border)] px-5">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/lastbag-icon.svg"
                alt="LastBag"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-black tracking-tight text-[#1A1A1A]">
                Last<span className="text-[#D85A30]">Bag</span>
              </span>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--ink)]"
              aria-label="Close menu"
              onClick={() => setOpen(false)}>
              <span className="text-xl leading-none">×</span>
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
            {navItems.map((item) => (
              <a
                key={item.href}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-[var(--ink)] transition hover:bg-[var(--bg)]"
                href={item.href}
                onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
            <a
              className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-[var(--ink)] transition hover:bg-[var(--bg)]"
              href="/about"
              onClick={() => setOpen(false)}>
              About
            </a>
          </nav>

          <div className="border-t border-[var(--border)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <Link
              href="/for-restaurants"
              className="flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
              onClick={() => setOpen(false)}>
              For restaurants →
            </Link>
            <a
              href="tel:+9779716318840"
              className="mt-3 flex w-full items-center justify-center rounded-full border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)]"
              onClick={() => setOpen(false)}>
              Call 9716318840
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
