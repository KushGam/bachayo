'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#1A1A1A]">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[#E8E4DE] bg-[#FFFCFA] px-3.5 py-2.5 text-sm text-[#1A1A1A] outline-none transition focus:border-[#D85A30] focus:ring-2 focus:ring-[#FAECE7]"
          placeholder="Enter admin password"
          autoComplete="current-password"
          required
        />
      </div>
      {error ? <p className="text-sm font-medium text-[#DC2626]">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[#D85A30] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#993C1D] disabled:opacity-60">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
