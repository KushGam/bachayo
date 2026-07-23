'use client';

import { FormEvent, useState } from 'react';

const DEFAULT_SUCCESS =
  "✅ You're on the list! Check your email for confirmation.";

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not join waitlist');
      }

      setMessage(data.message?.trim() || DEFAULT_SUCCESS);
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <section id="waitlist" className="bg-[#0F0F0F] py-16">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-2xl font-bold text-white">
          🔔 Get notified when we launch near you
        </h2>
        <p className="mt-2 text-sm text-white/50">
          We&apos;re starting in Kathmandu. More cities coming soon.
        </p>

        {status === 'success' ? (
          <p className="mt-8 text-base font-semibold text-white">{message || DEFAULT_SUCCESS}</p>
        ) : (
          <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-md gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-xl bg-[#D85A30] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#993C1D] disabled:opacity-70">
              {status === 'loading' ? 'Saving…' : 'Notify me →'}
            </button>
          </form>
        )}

        {status === 'error' && error ? (
          <p className="mt-3 text-sm text-red-300">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
