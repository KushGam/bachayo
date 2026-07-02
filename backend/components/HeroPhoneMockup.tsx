export function HeroPhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Floating notification — top right */}
      <div className="absolute -right-4 -top-4 z-20 w-[200px] rotate-[4deg] rounded-2xl border border-white/60 bg-white p-3 shadow-xl shadow-black/15 md:-right-8">
        <p className="text-xs font-semibold text-[#D85A30]">🛍 New bag nearby!</p>
        <p className="mt-1 text-sm font-bold text-[#1A1A1A]">Dal Bhat Set</p>
        <p className="text-xs text-[#6B7280]">₨ 150 · 7–8pm pickup</p>
      </div>

      {/* Phone frame */}
      <div className="relative mx-auto w-[300px] overflow-hidden rounded-[44px] border-4 border-white/20 bg-white shadow-2xl shadow-black/40">
        <div className="mx-auto h-7 w-24 rounded-b-2xl bg-[#1A1A1A]" />

        <div className="bg-[#D85A30] px-5 pb-6 pt-3">
          <p className="text-sm font-semibold text-white">Good morning 👋</p>
          <p className="mt-1 text-xs text-white/70">Thamel, Kathmandu</p>
        </div>

        <div className="bg-[#F5F3EF] px-4 py-4 pb-8">
          <div className="mb-4 flex gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#D85A30] shadow-sm">
              🍛 Restaurant
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#D85A30] shadow-sm">
              ☕ Cafe
            </span>
          </div>

          <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xs text-[#6B7280]">Thakali Kitchen</p>
            <p className="mt-1 text-sm font-bold text-[#1A1A1A]">Dal Bhat Set</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-black text-[#D85A30]">₨ 150</span>
                <span className="text-xs text-[#9CA3AF] line-through">₨ 500</span>
              </div>
              <span className="rounded-full bg-[#D85A30] px-3 py-1 text-xs font-semibold text-white">
                Reserve →
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xs text-[#6B7280]">Himalayan Bakery</p>
            <p className="mt-1 text-sm font-bold text-[#1A1A1A]">Bakery Mix</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-black text-[#D85A30]">₨ 200</span>
                <span className="text-xs text-[#9CA3AF] line-through">₨ 600</span>
              </div>
              <span className="rounded-full bg-[#D85A30] px-3 py-1 text-xs font-semibold text-white">
                Reserve →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating success card — bottom left */}
      <div className="absolute -bottom-6 -left-6 z-20 w-[210px] rotate-[-5deg] rounded-2xl border border-white/20 bg-[#10B981] p-3 shadow-xl shadow-black/20 md:-left-10">
        <p className="text-sm font-semibold text-white">✓ Picked up!</p>
        <p className="mt-1 text-sm text-white/90">You saved ₨ 350 today 🎉</p>
      </div>
    </div>
  );
}
