import type { LucideIcon } from 'lucide-react';
import { Calendar, LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  className?: string;
};

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon = LayoutDashboard,
  iconBg = '#F5F3EF',
  iconColor = '#6B7280',
  className = '',
}: StatCardProps) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div
      className={[
        'group relative overflow-hidden rounded-2xl border border-[#F0EDE8] bg-white p-6 transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
        className,
      ].join(' ')}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">{title}</p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg, color: iconColor }}>
          <Icon size={18} strokeWidth={2.25} />
        </div>
      </div>

      <p className="mt-4 text-[36px] font-bold leading-none text-[#1A1A1A]">{displayValue}</p>
      {subtext ? <p className="mt-1.5 text-[13px] text-[#6B7280]">{subtext}</p> : null}

      <span
        className="pointer-events-none absolute bottom-[-10px] right-4 select-none text-[80px] font-black leading-none text-black/[0.03]"
        aria-hidden="true">
        {displayValue}
      </span>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  showLive = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showLive?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold text-[#1A1A1A]">{title}</h1>
        {subtitle ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#9CA3AF]" />
              <p className="text-sm text-[#6B7280]">{subtitle}</p>
            </div>
            {showLive ? (
              <div className="ml-4 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF]" />
                <span className="text-xs font-medium text-[#9CA3AF]">Updated recently</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
