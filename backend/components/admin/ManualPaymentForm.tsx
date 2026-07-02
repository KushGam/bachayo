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
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [ref, setRef] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const selected = useMemo(() => partners.find((p) => p.id === partnerId), [partnerId, partners]);

  function autofillAmount(id: string) {
    const p = partners.find((x) => x.id === id);
    const tier = p?.subscription_tier ?? 'small';
    setAmount(String(tierPrices[tier] ?? 800));
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-medium uppercase text-gray-500">Record manual payment</h2>
      <div className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Partner</label>
          <select
            value={partnerId}
            onChange={(e) => {
              setPartnerId(e.target.value);
              autofillAmount(e.target.value);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Amount (NPR)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Payment method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="esewa">eSewa</option>
            <option value="khalti">Khalti</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Reference (optional)</label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Transaction ID or note"
          />
        </div>
      </div>
      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
      <button
        type="button"
        disabled={pending || !partnerId || !amount}
        onClick={() =>
          start(async () => {
            await recordManualPayment({
              partnerId,
              amount: Number(amount),
              paymentMethod: method,
              paymentRef: ref || undefined,
            });
            setMessage(`Payment recorded for ${selected?.name ?? 'partner'}.`);
          })
        }
        className="mt-4 rounded-lg bg-[#D85A30] px-4 py-2 text-sm font-semibold text-white hover:bg-[#993C1D] disabled:opacity-60">
        {pending ? 'Saving…' : 'Record payment'}
      </button>
    </section>
  );
}
