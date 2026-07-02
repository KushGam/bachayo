export function AdminLogo({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="8" fill="#D85A30" />
        <path
          d="M8 11h12l-1.2 11H9.2L8 11zm2.2-3h7.6l1 3H9.2l1-3z"
          fill="white"
          fillOpacity="0.95"
        />
        <path d="M11 8.5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>Bachayo</span>
      <span className="ml-1 rounded bg-[#D85A30] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white">
        ADMIN
      </span>
    </div>
  );
}
