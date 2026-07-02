'use client';

import { FormEvent, useState } from 'react';

export function WaitlistSignup() {
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          city: city.trim() || null,
        }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        setError(data.error ?? 'Could not join waitlist');
        return;
      }

      setMessage('You are on the list! We will notify you soon.');
      setEmail('');
      setCity('');
    } catch {
      setError('Could not join waitlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 rounded-2xl border border-white/20 bg-white/5 p-4">
      <div className="text-white font-semibold text-sm">Get notified when we launch in your city</div>
      <form onSubmit={submit} className="mt-3 flex flex-col md:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40"
          required
        />
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="City (optional)"
          className="md:w-48 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#D85A30] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#993C1D] disabled:opacity-60">
          {loading ? 'Submitting…' : 'Notify me'}
        </button>
      </form>
      {message ? <div className="mt-2 text-xs text-[#86EFAC]">{message}</div> : null}
      {error ? <div className="mt-2 text-xs text-[#FCA5A5]">{error}</div> : null}
    </div>
  );
}

