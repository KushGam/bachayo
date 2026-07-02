'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';

function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 7h10l1.2 14H5.8L7 7Z"
          stroke="#D85A30"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 7a3 3 0 0 1 6 0" stroke="#D85A30" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-[20px] font-bold text-[#D85A30]">Bachayo</span>
    </Link>
  );
}

export function LandingNavbar() {
  const pathname = usePathname();
  const shouldShow = useMemo(() => !pathname.startsWith('/admin'), [pathname]);
  const [open, setOpen] = useState(false);

  if (!shouldShow) return null;

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Logo />

        {/* Desktop center links */}
        <nav className="hidden lg:flex items-center gap-6">
          <a className="text-gray-600 hover:text-[#D85A30] transition text-sm font-medium" href="#how-it-works">
            How it works
          </a>
          <Link
            className="text-gray-600 hover:text-[#D85A30] transition text-sm font-medium"
            href="/for-restaurants">
            For restaurants
          </Link>
          <a className="text-gray-600 hover:text-[#D85A30] transition text-sm font-medium" href="#cities">
            Cities
          </a>
          <Link className="text-gray-600 hover:text-[#D85A30] transition text-sm font-medium" href="/legal/about">
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
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
        <div className="max-w-6xl mx-auto px-6 pb-4">
          <nav className="flex flex-col gap-3 pt-2">
            <a
              className="text-gray-700 hover:text-[#D85A30] transition text-sm font-medium"
              href="#how-it-works"
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
              href="#cities"
              onClick={() => setOpen(false)}>
              Cities
            </a>
            <Link
              className="text-gray-700 hover:text-[#D85A30] transition text-sm font-medium"
              href="/legal/about"
              onClick={() => setOpen(false)}>
              About
            </Link>

            <Link
              href="/for-restaurants"
              className="mt-2 inline-flex justify-center bg-[#D85A30] text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-[#993C1D] transition">
              For restaurants →
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

