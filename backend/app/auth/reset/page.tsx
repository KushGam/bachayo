'use client';

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

/**
 * Password-reset bridge.
 * Supabase emails land here with tokens in the hash/query. We:
 * 1) Hand off to the native app via lastbag:// deep link
 * 2) Fall back to an in-browser password form if the app isn't installed
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
        },
      })
    : null;

function buildAppDeepLink() {
  if (typeof window === 'undefined') return 'lastbag://auth/callback?type=recovery';
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (!params.get('type')) params.set('type', 'recovery');
  const qs = params.toString();
  return `lastbag://auth/callback${qs ? `?${qs}` : '?type=recovery'}${hash}`;
}

export default function AuthResetPage() {
  const [status, setStatus] = useState<'opening' | 'form' | 'done' | 'error'>('opening');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const deepLink = useMemo(() => buildAppDeepLink(), []);

  useEffect(() => {
    void (async () => {
      if (!supabase) {
        setStatus('error');
        setError('Reset is temporarily unavailable.');
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        // Prefer opening the native app with the recovery tokens.
        window.location.href = deepLink;

        // If still here after a beat, show the web form.
        const timer = window.setTimeout(() => {
          setStatus('form');
        }, 1200);
        return () => window.clearTimeout(timer);
      } catch (err) {
        console.error('[auth/reset]', err);
        setStatus('form');
      }
    })();
  }, [deepLink]);

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!supabase) {
      setError('Reset is temporarily unavailable.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStatus('done');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F3EF] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E8E4DE] bg-[#FFFCFA] p-6 shadow-sm">
        {status === 'opening' ? (
          <div className="space-y-3 text-center">
            <p className="text-lg font-semibold text-[#1C1917]">Opening LastBag…</p>
            <p className="text-sm text-[#6B6560]">
              If the app doesn&apos;t open, you can set a new password here.
            </p>
            <a
              href={deepLink}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#D85A30] px-5 text-sm font-semibold text-white">
              Open LastBag app
            </a>
          </div>
        ) : null}

        {status === 'form' ? (
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-[#1C1917]">Set new password</h1>
              <p className="mt-1 text-sm text-[#6B6560]">
                Choose a password for your LastBag account.
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#374151]">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:border-[#D85A30]"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#374151]">Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:border-[#D85A30]"
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </label>
            {error ? (
              <p className="rounded-xl bg-[#F5EBE8] px-3 py-2 text-sm text-[#7A3A30]">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="flex h-11 w-full items-center justify-center rounded-full bg-[#D85A30] text-sm font-semibold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save password'}
            </button>
            <a
              href={deepLink}
              className="block text-center text-sm font-semibold text-[#D85A30]">
              Or open in the LastBag app →
            </a>
          </form>
        ) : null}

        {status === 'done' ? (
          <div className="space-y-3 text-center">
            <p className="text-lg font-semibold text-[#1C1917]">Password updated</p>
            <p className="text-sm text-[#6B6560]">You can sign in with your new password.</p>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#D85A30] px-5 text-sm font-semibold text-white">
              Done
            </Link>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="space-y-3 text-center">
            <p className="text-lg font-semibold text-[#1C1917]">Couldn&apos;t start reset</p>
            <p className="text-sm text-[#6B6560]">{error}</p>
            <Link href="/" className="text-sm font-semibold text-[#D85A30]">
              Back to LastBag
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
