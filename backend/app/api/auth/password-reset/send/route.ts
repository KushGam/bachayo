import { NextRequest, NextResponse } from 'next/server';

import { sendPasswordResetOtp } from '@/lib/password-reset-otp';

export async function POST(request: NextRequest) {
  let email: unknown;

  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof email !== 'string' || !email.trim() || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  try {
    const result = await sendPasswordResetOtp(email);
    return NextResponse.json({
      success: true,
      email: result.email,
      expires_in: result.expiresInSeconds,
    });
  } catch (error) {
    console.error('[password-reset/send] failed:', error);
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code ?? '')
        : '';
    const message =
      error instanceof Error ? error.message : 'Could not send reset code.';

    if (code === 'RATE_LIMITED') {
      return NextResponse.json({ error: message, code }, { status: 429 });
    }

    if (/password_reset_otps|schema cache|does not exist/i.test(message)) {
      return NextResponse.json(
        { error: 'Password reset is not ready yet. Please apply migration 059 and try again.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
