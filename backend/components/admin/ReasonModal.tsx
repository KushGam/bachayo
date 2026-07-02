'use client';

export const SUSPEND_REASON_PILLS = [
  'Fake listing',
  'Food safety complaint',
  'Multiple no-shows',
  'Inappropriate content',
] as const;

export const REJECT_REASON_PILLS = [
  'Cannot verify business',
  'Outside service area',
  'Duplicate account',
  'Incomplete information',
] as const;

export type ReasonModalAction = 'suspend' | 'reject';

type ReasonModalProps = {
  open: boolean;
  action: ReasonModalAction;
  reason: string;
  pending?: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const ACTION_LABELS: Record<ReasonModalAction, string> = {
  suspend: 'suspension',
  reject: 'rejection',
};

export function ReasonModal({
  open,
  action,
  reason,
  pending = false,
  onReasonChange,
  onClose,
  onConfirm,
}: ReasonModalProps) {
  if (!open) return null;

  const pills = action === 'suspend' ? SUSPEND_REASON_PILLS : REJECT_REASON_PILLS;
  const confirmLabel = action === 'suspend' ? 'Confirm suspension' : 'Confirm rejection';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Reason for {ACTION_LABELS[action]}</h3>
        <p className="mt-2 text-sm text-gray-600">The partner will see this reason in the app.</p>

        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={4}
          placeholder="e.g. Restaurant doesn't exist at the listed address"
          className="mt-4 h-24 w-full resize-none rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D85A30]"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {pills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => onReasonChange(pill)}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">
              {pill}
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-xl bg-[#D85A30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#993C1D] disabled:opacity-60"
            onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
