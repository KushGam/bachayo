import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Binds a NepalOTP otp_id to the phone that requested it so verify cannot
 * mint a session for a different number than the one that received the SMS.
 */
function bindingSecret() {
  const secret = process.env.INTERNAL_SECRET || process.env.NEPALOTP_API_KEY;
  if (!secret) {
    throw new Error('Missing INTERNAL_SECRET (or NEPALOTP_API_KEY) for OTP binding');
  }
  return secret;
}

function sign(payload: string) {
  return createHmac('sha256', bindingSecret()).update(payload).digest('base64url');
}

export function bindOtpSession(otpId: string, phoneLocal: string, ttlMs = 10 * 60 * 1000) {
  const body = Buffer.from(
    JSON.stringify({ oid: otpId, p: phoneLocal, e: Date.now() + ttlMs }),
    'utf8',
  ).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function unbindOtpSession(token: string): { otpId: string; phoneLocal: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  let expected: string;
  try {
    expected = sign(body);
  } catch {
    return null;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      oid?: string;
      p?: string;
      e?: number;
    };
    if (!parsed.oid || !parsed.p || !parsed.e) return null;
    if (Date.now() > parsed.e) return null;
    return { otpId: parsed.oid, phoneLocal: parsed.p };
  } catch {
    return null;
  }
}
