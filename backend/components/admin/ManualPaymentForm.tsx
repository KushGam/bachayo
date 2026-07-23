'use client';

import { useMemo, useState, useTransition } from 'react';

import { recordManualPayment } from '@/app/admin/actions';

type PartnerOption = { id: string; name: string; subscription_tier: string | null };

export function ManualPaymentForm({
  partners,
  tierPrices,
}: {
  partners: PartnerOption[];
  tierPrices: Record<string, number>;
}) {
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? '');
  const [tier, setTier] = useState<'small' | 'medium' | 'large'>('small');
  const [amount, setAmount] = useState(String(tierPrices.small ?? 800));
  const [method, setMethod] = useState('esewa');
  const [ref, setRef] = useState('');
  const [months, setMonths] = useState('1');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const selected = useMemo(() => partners.find((p) => p.id === partnerId), [partnerId, partners]);

  function applyPartner(id: string) {
    const p = partners.find((x) => x.id === id);
    const nextTier = (p?.subscription_tier ?? 'small') as 'small' | 'medium' | 'large';
    setPartnerId(id);
    setTier(nextTier);
    setAmount(String(tierPrices[nextTier] ?? 800));
  }

  function applyTier(next: 'small' | 'medium' | 'large') {
    setTier(next);
    setAmount(String(tierPrices[next] ?? 800));
  }

  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-lg font-bold text-gray-900">Record manual payment</h2>
      <p className="mb-5 text-sm text-gray-500">
        When a partner WhatsApps a payment screenshot, mark it paid here to activate their plan.
      </p>

      <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Partner</label>
          <select
            title="Partner"
            value={partnerId}
            onChange={(e) => applyPartner(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tier</label>
          <select
            title="Tier"
            value={tier}
            onChange={(e) => applyTier(e.target.value as 'small' | 'medium' | 'large')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Amount (NPR)</label>
          <input
            type="number"
            title="Amount NPR"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Payment method</label>
          <select
            title="Payment method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="esewa">eSewa</option>
            <option value="khalti">Khalti</option>
            <option value="bank_transfer">Bank</option>
            <option value="cash">Cash</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Months</label>
          <input
            type="number"
            min={1}
            title="Months"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Transaction reference
          </label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. eSewa transaction ID or bank ref"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Optional admin notes"
          />
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        disabled={pending || !partnerId || !amount}
        onClick={() =>
          start(async () => {
            setMessage(null);
            setError(null);
            try {
              const result = await recordManualPayment({
                partnerId,
                amount: Number(amount),
                paymentMethod: method,
                paymentRef: ref || undefined,
                tier,
                months: Number(months) || 1,
                notes: notes || undefined,
              });
              setMessage(
                `Payment recorded for ${result.partnerName ?? selected?.name ?? 'partner'}. Active until ${new Date(result.newExpiry).toLocaleDateString('en-NP')}.`,
              );
              setRef('');
              setNotes('');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not record payment');
            }
          })
        }
        className="mt-4 rounded-xl bg-[#10B981] px-6 py-3 text-sm font-semibold text-white hover:bg-[#059669] disabled:opacity-60">
        {pending ? 'Saving…' : 'Record payment & activate'}
      </button>
    </section>
  );
}
