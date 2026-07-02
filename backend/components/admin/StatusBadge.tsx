const STATUS_STYLES: Record<string, string> = {
  trial: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  past_due: 'bg-red-100 text-red-800',
  paused: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
  picked_up: 'bg-gray-100 text-gray-600',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {label ?? status.replace('_', ' ')}
    </span>
  );
}

const CATEGORY_STYLES: Record<string, string> = {
  restaurant: 'bg-[#FAECE7] text-[#993C1D]',
  cafe: 'bg-[#ECFDF5] text-[#065F46]',
  bakery: 'bg-[#FEF3C7] text-[#92400E]',
  mart: 'bg-[#EFF6FF] text-[#1E40AF]',
  hotel: 'bg-[#F5F3FF] text-[#4C1D95]',
};

export function CategoryBadge({ label, category }: { label: string; category?: string }) {
  const style = category ? (CATEGORY_STYLES[category] ?? 'bg-[#FAECE7] text-[#993C1D]') : 'bg-[#FAECE7] text-[#993C1D]';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>
      {label}
    </span>
  );
}
