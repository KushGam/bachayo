import { NextRequest, NextResponse } from 'next/server';

import { sendPendingEmailSignupOtp } from '@/lib/pending-email-signup';

export async function POST(request: NextRequest) {
  let email: unknown;
  let password: unknown;

  try {
    ({ email, password } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof email !== 'string' || !email.trim() || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  try {
    const result = await sendPendingEmailSignupOtp(email, password);
    return NextResponse.json({
      success: true,
      email: result.email,
      expires_in: result.expiresInSeconds,
    });
  } catch (error) {
    console.error('[email-otp/send] failed:', error);
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code ?? '')
        : '';
    const message =
      error instanceof Error ? error.message : 'Could not send verification email.';

    if (code === 'ACCOUNT_EXISTS') {
      return NextResponse.json({ error: message, code }, { status: 409 });
    }
    if (code === 'RATE_LIMITED') {
      return NextResponse.json({ error: message, code }, { status: 429 });
    }

    // Table missing / misconfigured
    if (/pending_email_signups|schema cache|does not exist/i.test(message)) {
      return NextResponse.json(
        { error: 'Email verification is not ready yet. Please try again shortly.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
