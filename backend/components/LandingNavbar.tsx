'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const HOME_SECTIONS = ['how-it-works', 'cities', 'about', 'download'] as const;

export function LandingNavbar() {
  const pathname = usePathname();
  const shouldShow = useMemo(() => !pathname.startsWith('/admin'), [pathname]);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll);
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
        { threshold: 0.35 },
      );
      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [pathname]);

  if (!shouldShow) return null;

  const isHome = pathname === '/';
  const onHero = isHome && !scrolled;
  const navBg = onHero
    ? 'bg-transparent border-b border-white/10'
    : scrolled || pathname !== '/'
      ? 'bg-white/95 border-b border-gray-100 shadow-sm'
      : 'bg-white/70 border-b border-gray-100';

  const linkClass = (active: boolean) =>
    `transition text-sm font-medium ${
      active
        ? onHero
          ? 'text-white'
          : 'text-[#D85A30]'
        : onHero
          ? 'text-white/75 hover:text-white'
          : 'text-gray-600 hover:text-[#D85A30]'
    }`;

  return (
    <header className={`fixed top-0 w-full z-50 backdrop-blur-md transition-all duration-300 ${navBg}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center">
          <span
            className={`text-2xl font-extrabold tracking-tight ${
              onHero ? 'text-white' : 'text-[#D85A30]'
            }`}>
            LastBag
          </span>
        </Link>

        {/* Desktop center links */}
        <nav className="hidden lg:flex items-center gap-6">
          <a
            className={linkClass(isHome && activeSection === 'how-it-works')}
            href={isHome ? '#how-it-works' : '/#how-it-works'}>
            How it works
          </a>
          <Link
            className={linkClass(pathname === '/for-restaurants')}
            href="/for-restaurants">
            For restaurants
          </Link>
          <a
            className={linkClass(isHome && activeSection === 'cities')}
            href={isHome ? '#cities' : '/#cities'}>
            Cities
          </a>
          <Link
            className={linkClass(pathname === '/about' || (isHome && activeSection === 'about'))}
            href="/about">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/for-restaurants"
            className={`hidden md:inline-flex px-4 py-2 rounded-full text-sm font-semibold transition ${
              onHero
                ? 'bg-white text-[#D85A30] hover:bg-[#FFF5F2]'
                : 'bg-[#D85A30] text-white hover:bg-[#993C1D]'
            }`}>
            For restaurants →
          </Link>

          <button
            type="button"
            className={`lg:hidden w-10 h-10 rounded-full border flex items-center justify-center ${
              onHero
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-gray-200 bg-white/70 text-[#D85A30]'
            }`}
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}>
            <span className={`font-bold text-lg ${onHero ? 'text-white' : 'text-[#D85A30]'}`}>
              {open ? '×' : '≡'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          open ? 'max-h-screen border-b border-gray-100 bg-white opacity-100' : 'max-h-0 opacity-0'
        }`}>
        <div className="max-w-6xl mx-auto px-6 pb-6 pt-2">
          <nav className="flex flex-col gap-3 pt-2">
            <a
              className="text-gray-700 hover:text-[#D85A30] transition text-sm font-medium"
              href={isHome ? '#how-it-works' : '/#how-it-works'}
              onClick={() => setOpen(false)}>
              How it works
            </a>
            <Link
              className="text-gray-700 hover:text-[#D85A30] transition text-sm font-medium"
              href="/for-restaurants"
              onClick={() => setOpen(false)}>
              For restaurants
            </Link>
            <a
              className="text-gray-700 hover:text-[#D85A30] transition text-sm font-medium"
              href={isHome ? '#cities' : '/#cities'}
              onClick={() => setOpen(false)}>
              Cities
            </a>
            <Link
              className="text-gray-700 hover:text-[#D85A30] transition text-sm font-medium"
              href="/about"
              onClick={() => setOpen(false)}>
              About
            </Link>

            <Link
              href={isHome ? '#download' : '/#download'}
              className="mt-4 inline-flex justify-center bg-[#D85A30] text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-[#993C1D] transition"
              onClick={() => setOpen(false)}>
              Download app
            </Link>
            <Link
              href="/for-restaurants"
              className="inline-flex justify-center border border-[#D85A30] text-[#D85A30] px-4 py-3 rounded-full text-sm font-semibold hover:bg-[#FAECE7] transition"
              onClick={() => setOpen(false)}>
              For restaurants
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

