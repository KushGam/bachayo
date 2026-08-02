import { NextRequest, NextResponse } from 'next/server';

import { confirmPasswordReset } from '@/lib/password-reset-otp';

export async function POST(request: NextRequest) {
  let reset_token: unknown;
  let password: unknown;

  try {
    ({ reset_token, password } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof reset_token !== 'string' || !reset_token.trim()) {
    return NextResponse.json({ error: 'Reset session missing. Request a new code.' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  try {
    const result = await confirmPasswordReset({
      resetToken: reset_token,
      password,
    });

    return NextResponse.json({
      success: true,
      email: result.email,
      user_id: result.userId,
      access_token: result.session?.access_token ?? null,
      refresh_token: result.session?.refresh_token ?? null,
    });
  } catch (error) {
    console.error('[password-reset/confirm] failed:', error);
    const codeName =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code ?? '')
        : '';
    const message =
      error instanceof Error ? error.message : 'Could not update password.';

    if (
      codeName === 'RESET_TOKEN_INVALID' ||
      codeName === 'RESET_TOKEN_EXPIRED' ||
      codeName === 'WEAK_PASSWORD'
    ) {
      return NextResponse.json({ error: message, code: codeName }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
