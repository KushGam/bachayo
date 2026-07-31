'use client';

import type { MouseEvent } from 'react';

type LaunchOfferBannerProps = {
  className?: string;
  /** Element id to scroll to. Falls back to /#waitlist when missing on this page. */
  ctaTargetId?: string;
};

export function LaunchOfferBanner({
  className = '',
  ctaTargetId = 'waitlist',
}: LaunchOfferBannerProps) {
  const handleClaim = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(ctaTargetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    window.location.href = `/#${ctaTargetId}`;
  };

  return (
    <div
      className={`relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-[#D85A30] to-[#E8723D] p-6 text-center ${className}`}>
      <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center text-8xl text-white opacity-10">
        🛍🛍🛍🛍🛍
      </div>

      <div className="relative">
        <div className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
          🎉 Limited Launch Offer
        </div>

        <h3 className="mb-2 text-2xl font-black text-white md:text-3xl">
          First month FREE.
          <br className="sm:hidden" /> Second month 50% off.
        </h3>

        <p className="mb-6 text-sm text-white/80 md:text-base">
          Join LastBag during our Nepal launch and get 2 months at almost no cost. No credit card
          required to start.
        </p>

        <div className="mb-6 flex flex-col justify-center gap-4 md:flex-row">
          <div className="mx-auto max-w-[180px] flex-1 rounded-xl bg-white/10 p-4 md:mx-0">
            <div className="text-2xl font-black text-white">Month 1</div>
            <div className="mt-1 text-3xl font-black text-white">FREE</div>
            <div className="mt-1 text-xs text-white/60">No payment needed</div>
          </div>

          <div className="flex items-center justify-center text-2xl text-white/40">→</div>

          <div className="mx-auto max-w-[180px] flex-1 rounded-xl bg-white/10 p-4 md:mx-0">
            <div className="text-2xl font-black text-white">Month 2</div>
            <div className="mt-1 text-3xl font-black text-white">50% off</div>
            <div className="mt-1 text-xs text-white/60">Half price</div>
          </div>

          <div className="flex items-center justify-center text-2xl text-white/40">→</div>

          <div className="mx-auto max-w-[180px] flex-1 rounded-xl bg-white/10 p-4 md:mx-0">
            <div className="text-2xl font-black text-white">Month 3+</div>
            <div className="mt-1 text-3xl font-black text-white">Full</div>
            <div className="mt-1 text-xs text-white/60">Standard price</div>
          </div>
        </div>

        <a
          href={`/#${ctaTargetId}`}
          onClick={handleClaim}
          className="inline-block rounded-2xl bg-white px-8 py-4 text-lg font-black text-[#D85A30] transition hover:bg-white/90">
          Claim your free month →
        </a>

        <p className="mt-4 text-xs text-white/40">
          Available for new partners only. Limited time offer during Nepal launch.
        </p>
      </div>
    </div>
  );
}
