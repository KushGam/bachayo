import { NextRequest, NextResponse } from 'next/server';

import {
  NepalOtpError,
  isValidNepalMobile,
  normalizeNepalPhone,
  sendOtp,
  toE164NepalPhone,
} from '@/lib/nepalotp';
import { bindOtpSession } from '@/lib/otp-binding';

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
    const phoneLocal = normalizeNepalPhone(phone);
    const otp_id = bindOtpSession(result.otp_id, phoneLocal);

    return NextResponse.json({
      success: true,
      phone: toE164NepalPhone(phone),
      otp_id,
    });
  } catch (error) {
    console.error('[NepalOTP] send failed:', error);

    if (error instanceof NepalOtpError) {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        const retryMatch = /(\d+)\s*(second|minute|hour)/i.exec(error.message);
        let retry_after = 45 * 60;
        if (retryMatch) {
          const amount = Number(retryMatch[1]);
          const unit = retryMatch[2].toLowerCase();
          retry_after =
            unit.startsWith('hour') ? amount * 3600 : unit.startsWith('minute') ? amount * 60 : amount;
        }
        return NextResponse.json(
          {
            error: 'Too many attempts. Please wait before requesting a new code.',
            code: 'RATE_LIMIT_EXCEEDED',
            retry_after,
          },
          { status: 429 },
        );
      }
      if (
        error.code === 'INSUFFICIENT_BALANCE' ||
        error.code === 'MISSING_API_KEY' ||
        error.code === 'NETWORK_ERROR'
      ) {
        return NextResponse.json(
          {
            error:
              error.code === 'NETWORK_ERROR'
                ? 'OTP service unreachable. Try again later or contact support.'
                : 'Service temporarily unavailable.',
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status >= 400 && error.status < 600 ? error.status : 500 },
      );
    }

    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
