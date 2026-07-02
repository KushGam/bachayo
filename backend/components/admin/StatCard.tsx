import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  subtext?: string;
  accent?: 'neutral' | 'revenue' | 'warning' | 'error';
  className?: string;
};

const ACCENT: Record<NonNullable<StatCardProps['accent']>, string> = {
  neutral: 'border-l-gray-300',
  revenue: 'border-l-green-500',
  warning: 'border-l-amber-500',
  error: 'border-l-red-500',
};

export function StatCard({
  title,
  value,
  subtext,
  accent = 'neutral',
  className = '',
}: StatCardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-gray-200 bg-white p-6 border-l-4',
        ACCENT[accent],
        className,
      ].join(' ')}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      {subtext ? <p className="mt-1 text-sm text-gray-500">{subtext}</p> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
