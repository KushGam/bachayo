import { NextRequest, NextResponse } from 'next/server';

import {
  NepalOtpError,
  isValidNepalMobile,
  toE164NepalPhone,
  verifyOtp,
} from '@/lib/nepalotp';
import { mintSessionForPhone } from '@/lib/phone-session';

const ERROR_COPY: Record<string, string> = {
  INVALID_OTP: 'Wrong code. Please try again.',
  OTP_EXPIRED: 'Code expired. Request a new one.',
  MAX_ATTEMPTS_EXCEEDED: 'Too many failed attempts. Request a new code.',
  OTP_NOT_FOUND: 'Invalid verification. Please restart.',
};

export async function POST(request: NextRequest) {
  let phone: unknown;
  let code: unknown;
  let intent: unknown;

  try {
    ({ phone, code, intent } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof phone !== 'string' || typeof code !== 'string' || !phone || !code) {
    return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
  }

  if (!isValidNepalMobile(phone)) {
    return NextResponse.json(
      { error: 'Enter a valid Nepal mobile number' },
      { status: 400 },
    );
  }

  try {
    const result = await verifyOtp(phone, code);

    if (result.verified === false) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }
  } catch (error) {
    console.error('[NepalOTP] verify failed:', error);

    if (error instanceof NepalOtpError) {
      if (error.code === 'MISSING_API_KEY') {
        return NextResponse.json(
          { error: 'Service temporarily unavailable.' },
          { status: 503 },
        );
      }
      const message = (error.code && ERROR_COPY[error.code]) || error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  // "Change my number" only needs proof the code was correct — the caller
  // already has a session and must not be swapped onto a different one.
  if (intent === 'verify_only') {
    return NextResponse.json({ success: true });
  }

  try {
    const { session, isNewUser, profile } = await mintSessionForPhone(
      toE164NepalPhone(phone),
    );

    return NextResponse.json({
      success: true,
      is_new_user: isNewUser,
      profile,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (error) {
    console.error('[NepalOTP] session mint failed:', error);
    return NextResponse.json({ error: 'Could not sign you in' }, { status: 500 });
  }
}
