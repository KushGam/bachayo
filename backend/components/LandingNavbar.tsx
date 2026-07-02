'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const HOME_SECTIONS = ['how-it-works', 'cities', 'about', 'download'] as const;

function Logo() {
  return (
    <Link href="/" className="inline-flex items-center">
      <span className="text-2xl font-extrabold tracking-tight text-[#D85A30]">Bachayo</span>
    </Link>
  );
}

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
  const navBg = scrolled || pathname !== '/'
    ? 'bg-white/95 border-b border-gray-100 shadow-sm'
    : 'bg-white/70 border-b border-gray-100';

  return (
    <header className={`fixed top-0 w-full z-50 backdrop-blur-md transition-all duration-300 ${navBg}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Logo />

        {/* Desktop center links */}
        <nav className="hidden lg:flex items-center gap-6">
          <a
            className={`transition text-sm font-medium ${
              isHome && activeSection === 'how-it-works' ? 'text-[#D85A30]' : 'text-gray-600 hover:text-[#D85A30]'
            }`}
            href={isHome ? '#how-it-works' : '/#how-it-works'}>
            How it works
          </a>
          <Link
            className={`transition text-sm font-medium ${
              pathname === '/for-restaurants' ? 'text-[#D85A30]' : 'text-gray-600 hover:text-[#D85A30]'
            }`}
            href="/for-restaurants">
            For restaurants
          </Link>
          <a
            className={`transition text-sm font-medium ${
              isHome && activeSection === 'cities' ? 'text-[#D85A30]' : 'text-gray-600 hover:text-[#D85A30]'
            }`}
            href={isHome ? '#cities' : '/#cities'}>
            Cities
          </a>
          <Link
            className={`transition text-sm font-medium ${
              pathname === '/about' || (isHome && activeSection === 'about')
                ? 'text-[#D85A30]'
                : 'text-gray-600 hover:text-[#D85A30]'
            }`}
            href="/about">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/for-restaurants"
            className="hidden md:inline-flex bg-[#D85A30] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#993C1D] transition">
            For restaurants →
          </Link>

          <button
            type="button"
            className="lg:hidden w-10 h-10 rounded-full border border-gray-200 bg-white/70 flex items-center justify-center"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}>
            <span className="text-[#D85A30] font-bold text-lg">{open ? '×' : '≡'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
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

