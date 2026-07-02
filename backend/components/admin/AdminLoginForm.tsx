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
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#FAECE7]"
          placeholder="Enter admin password"
          autoComplete="current-password"
          required
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#D85A30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#993C1D] disabled:opacity-60">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
