'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const HOME_SECTIONS = ['how-it-works', 'for-restaurants', 'cities', 'impact'] as const;

export function LandingNavbar() {
  const pathname = usePathname();
  const shouldShow = useMemo(() => !pathname.startsWith('/admin'), [pathname]);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        { threshold: 0.25 },
      );
      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [pathname]);

  if (!shouldShow) return null;

  const isHome = pathname === '/';
  const onHero = isHome && !scrolled;

  const linkClass = (active: boolean) =>
    `text-sm font-medium transition ${
      active
        ? onHero
          ? 'text-white'
          : 'text-[#1A1A1A]'
        : onHero
          ? 'text-white/60 hover:text-white'
          : 'text-[#6B7280] hover:text-[#1A1A1A]'
    }`;

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        onHero
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-[#F0EDE8] bg-white/90 backdrop-blur'
      }`}>
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D85A30] text-sm">
            🛍
          </span>
          <span
            className={`text-xl font-bold ${onHero ? 'text-white' : 'text-[#1A1A1A]'}`}>
            LastBag
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            className={linkClass(isHome && activeSection === 'how-it-works')}
            href={isHome ? '#how-it-works' : '/#how-it-works'}>
            How it works
          </a>
          <a
            className={linkClass(isHome && activeSection === 'for-restaurants')}
            href={isHome ? '#for-restaurants' : '/#for-restaurants'}>
            For restaurants
          </a>
          <a
            className={linkClass(isHome && activeSection === 'cities')}
            href={isHome ? '#cities' : '/#cities'}>
            Cities
          </a>
          <a
            className={linkClass(isHome && activeSection === 'impact')}
            href={isHome ? '#impact' : '/#impact'}>
            Impact
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={isHome ? '#for-restaurants' : '/for-restaurants'}
            className="hidden rounded-full bg-[#D85A30] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#993C1D] md:inline-flex">
            For restaurants →
          </Link>

          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-full border md:hidden ${
              onHero
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-[#F0EDE8] bg-white text-[#1A1A1A]'
            }`}
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}>
            <span className="text-lg font-bold">{open ? '×' : '≡'}</span>
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          open
            ? 'max-h-screen border-b border-[#F0EDE8] bg-white opacity-100'
            : 'max-h-0 opacity-0'
        }`}>
        <div className="mx-auto max-w-[1200px] px-6 pb-6 pt-2">
          <nav className="flex flex-col gap-3 pt-2">
            {[
              { href: isHome ? '#how-it-works' : '/#how-it-works', label: 'How it works' },
              { href: isHome ? '#for-restaurants' : '/#for-restaurants', label: 'For restaurants' },
              { href: isHome ? '#cities' : '/#cities', label: 'Cities' },
              { href: isHome ? '#impact' : '/#impact', label: 'Impact' },
            ].map((item) => (
              <a
                key={item.href}
                className="text-sm font-medium text-[#6B7280] transition hover:text-[#1A1A1A]"
                href={item.href}
                onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
            <Link
              href={isHome ? '#for-restaurants' : '/for-restaurants'}
              className="mt-3 inline-flex justify-center rounded-full bg-[#D85A30] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#993C1D]"
              onClick={() => setOpen(false)}>
              For restaurants →
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
