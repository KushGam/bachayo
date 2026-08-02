'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

function ResetPasswordFallbackContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const deepLink = useMemo(() => {
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (email) params.set('email', email);
    const qs = params.toString();
    return `lastbag://reset-password${qs ? `?${qs}` : ''}`;
  }, [email, token]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F3EF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
      <div
        style={{
          background: 'white',
          borderRadius: 24,
          padding: 40,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: '#F5EBE8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#D85A30',
            fontWeight: 800,
          }}>
          LB
        </div>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#1A1A1A',
            margin: '16px 0 8px',
            letterSpacing: -0.4,
          }}>
          Reset your password
        </h1>

        <p
          style={{
            color: '#6B7280',
            fontSize: 14,
            marginBottom: 28,
            lineHeight: 1.6,
          }}>
          Open the LastBag app to complete your password reset.
        </p>

        {token ? (
          <a
            href={deepLink}
            style={{
              display: 'block',
              background: '#D85A30',
              color: 'white',
              fontWeight: 700,
              fontSize: 16,
              padding: 16,
              borderRadius: 999,
              textDecoration: 'none',
              marginBottom: 16,
            }}>
            Open in LastBag app →
          </a>
        ) : (
          <p style={{ color: '#7A3A30', fontSize: 13, marginBottom: 16 }}>
            This reset link is missing a token. Request a new one from the app.
          </p>
        )}

        <p
          style={{
            color: '#9CA3AF',
            fontSize: 12,
            marginBottom: 12,
          }}>
          Don&apos;t have the app?
        </p>

        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <span style={{ color: '#D85A30', fontSize: 13, fontWeight: 600 }}>App Store</span>
          <span style={{ color: '#E5E7EB' }}>·</span>
          <span style={{ color: '#D85A30', fontSize: 13, fontWeight: 600 }}>Google Play</span>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: '#9CA3AF' }}>
          Or continue with{' '}
          <Link href="/" style={{ color: '#D85A30', fontWeight: 600 }}>
            lastbag.app
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: '100vh',
            background: '#F5F3EF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <p style={{ color: '#6B7280', fontSize: 14 }}>Loading…</p>
        </main>
      }>
      <ResetPasswordFallbackContent />
    </Suspense>
  );
}
