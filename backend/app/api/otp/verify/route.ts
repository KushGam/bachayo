import { NextRequest, NextResponse } from 'next/server';

import {
  NepalOtpError,
  isValidNepalMobile,
  normalizeNepalPhone,
  toE164NepalPhone,
  verifyOtp,
} from '@/lib/nepalotp';
import { unbindOtpSession } from '@/lib/otp-binding';
import { mintSessionForPhone } from '@/lib/phone-session';

const ERROR_COPY: Record<string, string> = {
  INVALID_OTP: 'Wrong code. Please try again.',
  OTP_EXPIRED: 'Code expired. Request a new one.',
  MAX_ATTEMPTS_EXCEEDED: 'Too many wrong attempts. Please request a new code.',
  OTP_NOT_FOUND: 'Invalid verification. Please restart.',
  NETWORK_ERROR: 'No internet connection. Please check your connection and try again.',
};

export async function POST(request: NextRequest) {
  let phone: unknown;
  let code: unknown;
  let otp_id: unknown;
  let intent: unknown;

  try {
    ({ phone, code, otp_id, intent } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof phone !== 'string' || typeof code !== 'string' || !phone || !code) {
    return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
  }

  if (typeof otp_id !== 'string' || !otp_id) {
    return NextResponse.json(
      { error: 'Missing verification session. Please request a new code.' },
      { status: 400 },
    );
  }

  if (!isValidNepalMobile(phone)) {
    return NextResponse.json(
      { error: 'Enter a valid Nepal mobile number' },
      { status: 400 },
    );
  }

  const bound = unbindOtpSession(otp_id);
  if (!bound) {
    return NextResponse.json(
      { error: 'Verification expired. Please request a new code.', code: 'OTP_EXPIRED' },
      { status: 400 },
    );
  }

  const requestPhoneLocal = normalizeNepalPhone(phone);
  if (bound.phoneLocal !== requestPhoneLocal) {
    return NextResponse.json(
      { error: 'Phone number does not match this verification.', code: 'INVALID_OTP' },
      { status: 400 },
    );
  }

  try {
    const result = await verifyOtp(bound.otpId, code);

    if (result.verified === false) {
      return NextResponse.json(
        { error: ERROR_COPY.INVALID_OTP, code: 'INVALID_OTP' },
        { status: 400 },
      );
    }

    // If the provider returns a phone, it must match the bound session.
    if (result.phone) {
      const verifiedLocal = normalizeNepalPhone(result.phone);
      if (verifiedLocal !== bound.phoneLocal) {
        return NextResponse.json(
          { error: 'Phone number does not match this verification.', code: 'INVALID_OTP' },
          { status: 400 },
        );
      }
    }
  } catch (error) {
    console.error('[NepalOTP] verify failed:', error);

    if (error instanceof NepalOtpError) {
      if (error.code === 'MISSING_API_KEY' || error.code === 'NETWORK_ERROR') {
        return NextResponse.json(
          {
            error: ERROR_COPY[error.code] || 'Service temporarily unavailable.',
            code: error.code,
          },
          { status: 503 },
        );
      }
      const errCode = error.code || 'INVALID_OTP';
      const message = ERROR_COPY[errCode] || error.message;
      return NextResponse.json({ error: message, code: errCode }, { status: 400 });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  // "Change my number" only needs proof the code was correct — the caller
  // already has a session and must not be swapped onto a different one.
  if (intent === 'verify_only') {
    return NextResponse.json({ success: true });
  }

  try {
    // Always mint for the phone that was bound at send time — never trust body alone.
    const { session, isNewUser, profile } = await mintSessionForPhone(
      toE164NepalPhone(bound.phoneLocal),
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
