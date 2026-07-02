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

export function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md bg-[#FAECE7] px-2 py-0.5 text-xs font-medium text-[#993C1D]">
      {label}
    </span>
  );
}
