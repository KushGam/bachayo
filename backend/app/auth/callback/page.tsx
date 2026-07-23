'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Client-side PKCE callback.
 * (A server route with the service role cannot complete PKCE — the code verifier
 * lives in the browser.)
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

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      if (!supabase) {
        router.replace('/auth/error');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error) {
        console.error('[auth/callback]', error);
        router.replace(`/auth/error?error=${encodeURIComponent(error)}`);
        return;
      }

      const code = params.get('code');
      const next = params.get('next') || '/';

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('[auth/callback]', exchangeError.message);
          router.replace('/auth/error');
          return;
        }
      }

      router.replace(next.startsWith('/') ? next : '/');
    })();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F3EF]">
      <p className="text-sm text-[#6B7280]">Signing you in…</p>
    </main>
  );
}
