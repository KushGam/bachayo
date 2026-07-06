'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[auth/callback]', error.message);
          router.replace('/auth/error');
          return;
        }
      }

      router.replace('/');
    })();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F3EF]">
      <p className="text-sm text-[#6B7280]">Signing you in…</p>
    </main>
  );
}
