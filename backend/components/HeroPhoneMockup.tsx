export function HeroPhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[340px] animate-float">
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-white/25 via-transparent to-black/20 blur-2xl" />

      <div className="relative mx-auto w-[300px] overflow-hidden rounded-[44px] border border-white/25 bg-[#fffcfa] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)]">
        <div className="mx-auto h-7 w-28 rounded-b-2xl bg-[#1c1917]" />

        <div className="bg-gradient-to-br from-[#d85a30] to-[#993c1d] px-5 pb-7 pt-4">
          <p className="font-display text-lg font-bold text-white">Bags near you</p>
          <p className="mt-1 text-sm text-white/70">Closing soon · today</p>
        </div>

        <div className="space-y-3 bg-[#f5f3ef] px-4 py-4 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9c9590]">
            Rescue deals
          </p>

          <div className="rounded-2xl bg-white p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#6b6560]">Restaurant</p>
                <p className="mt-1 text-sm font-bold text-[#1c1917]">Lunch surprise bag</p>
              </div>
              <span className="rounded-full bg-[#faece7] px-2.5 py-1 text-[11px] font-semibold text-[#993c1d]">
                70% off
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#d85a30]">₨ 150</span>
                <span className="text-xs text-[#9c9590] line-through">₨ 500</span>
              </div>
              <span className="rounded-full bg-[#d85a30] px-3 py-1.5 text-xs font-semibold text-white">
                Reserve
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-3.5 shadow-sm">
            <p className="text-xs text-[#6b6560]">Bakery</p>
            <p className="mt-1 text-sm font-bold text-[#1c1917]">End-of-day mix</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#d85a30]">₨ 200</span>
                <span className="text-xs text-[#9c9590] line-through">₨ 600</span>
              </div>
              <span className="text-xs font-medium text-[#6b6560]">7–8 pm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
