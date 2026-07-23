export function AdminLogo({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lastbag-icon.svg"
        width={32}
        height={32}
        alt="LastBag"
        className="rounded-lg"
      />
      <div>
        <div
          className={`text-base font-black tracking-tight ${
            isDark ? 'text-white' : 'text-[#1A1A1A]'
          }`}>
          Last<span className="text-[#D85A30]">Bag</span>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Admin
        </div>
      </div>
    </div>
  );
}
