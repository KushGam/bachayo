import { NextRequest, NextResponse } from 'next/server';

import {
  NepalOtpError,
  isValidNepalMobile,
  sendOtp,
  toE164NepalPhone,
} from '@/lib/nepalotp';

export async function POST(request: NextRequest) {
  let phone: unknown;

  try {
    ({ phone } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof phone !== 'string' || !phone.trim()) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
  }

  if (!isValidNepalMobile(phone)) {
    return NextResponse.json(
      { error: 'Enter a valid Nepal mobile number' },
      { status: 400 },
    );
  }

  try {
    const result = await sendOtp(phone);

    return NextResponse.json({
      success: true,
      phone: toE164NepalPhone(phone),
      otp_id: result.otp_id ?? null,
    });
  } catch (error) {
    console.error('[NepalOTP] send failed:', error);

    if (error instanceof NepalOtpError) {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        return NextResponse.json(
          { error: 'Too many attempts. Please wait before trying again.' },
          { status: 429 },
        );
      }
      if (error.code === 'INSUFFICIENT_BALANCE' || error.code === 'MISSING_API_KEY') {
        return NextResponse.json(
          { error: 'Service temporarily unavailable.' },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
