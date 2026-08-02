import { NextRequest, NextResponse } from 'next/server';

import { verifyPasswordResetOtp } from '@/lib/password-reset-otp';

export async function POST(request: NextRequest) {
  let email: unknown;
  let code: unknown;

  try {
    ({ email, code } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  if (typeof code !== 'string' || code.replace(/\D/g, '').length !== 8) {
    return NextResponse.json({ error: 'Enter the 8-digit code from your email.' }, { status: 400 });
  }

  try {
    const result = await verifyPasswordResetOtp(email, code);
    return NextResponse.json({
      success: true,
      email: result.email,
      reset_token: result.resetToken,
    });
  } catch (error) {
    console.error('[password-reset/verify] failed:', error);
    const codeName =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code ?? '')
        : '';
    const message =
      error instanceof Error ? error.message : 'Verification failed.';

    if (
      codeName === 'INVALID_OTP' ||
      codeName === 'OTP_EXPIRED' ||
      codeName === 'OTP_NOT_FOUND' ||
      codeName === 'MAX_ATTEMPTS_EXCEEDED'
    ) {
      return NextResponse.json({ error: message, code: codeName }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
