import { NextResponse } from 'next/server';

/**
 * Legacy route — do not create auth users here.
 * Email signup must go through /api/auth/email-otp/send then /verify
 * so auth.users is only created after OTP succeeds.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Use /api/auth/email-otp/send and /api/auth/email-otp/verify. Accounts are created only after OTP verification.',
      code: 'USE_EMAIL_OTP',
    },
    { status: 410 },
  );
}
