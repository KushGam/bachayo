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
    const onScroll = () => setScrolled(window.scrollY > 40);
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
        { threshold: 0.3 },
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
    : 'bg-[var(--surface)]/90 border-b border-[var(--border)] shadow-[0_8px_30px_rgba(28,25,23,0.04)]';

  const linkClass = (active: boolean) =>
    `transition text-sm font-medium ${
      active
        ? onHero
          ? 'text-white'
          : 'text-[var(--primary)]'
        : onHero
          ? 'text-white/70 hover:text-white'
          : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'
    }`;

  return (
    <header className={`fixed top-0 z-50 w-full backdrop-blur-xl transition-all duration-300 ${navBg}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="inline-flex items-center">
          <span
            className={`font-display text-2xl font-extrabold tracking-tight ${
              onHero ? 'text-white' : 'text-[var(--primary)]'
            }`}>
            LastBag
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <a
            className={linkClass(isHome && activeSection === 'how-it-works')}
            href={isHome ? '#how-it-works' : '/#how-it-works'}>
            How it works
          </a>
          <Link className={linkClass(pathname === '/for-restaurants')} href="/for-restaurants">
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
            className={`hidden rounded-full px-5 py-2.5 text-sm font-semibold transition md:inline-flex ${
              onHero
                ? 'bg-white text-[var(--primary)] hover:bg-[#fff7f3]'
                : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
            }`}>
            Partner with us
          </Link>

          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-full border lg:hidden ${
              onHero
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-[var(--border)] bg-white text-[var(--primary)]'
            }`}
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}>
            <span className="text-lg font-bold">{open ? '×' : '≡'}</span>
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 lg:hidden ${
          open
            ? 'max-h-screen border-b border-[var(--border)] bg-[var(--surface)] opacity-100'
            : 'max-h-0 opacity-0'
        }`}>
        <div className="mx-auto max-w-6xl px-6 pb-6 pt-2">
          <nav className="flex flex-col gap-3 pt-2">
            <a
              className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
              href={isHome ? '#how-it-works' : '/#how-it-works'}
              onClick={() => setOpen(false)}>
              How it works
            </a>
            <Link
              className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
              href="/for-restaurants"
              onClick={() => setOpen(false)}>
              For restaurants
            </Link>
            <a
              className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
              href={isHome ? '#cities' : '/#cities'}
              onClick={() => setOpen(false)}>
              Cities
            </a>
            <Link
              className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
              href="/about"
              onClick={() => setOpen(false)}>
              About
            </Link>
            <Link
              href={isHome ? '#download' : '/#download'}
              className="mt-4 inline-flex justify-center rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
              onClick={() => setOpen(false)}>
              Download app
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
