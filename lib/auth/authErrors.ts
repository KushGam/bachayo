/**
 * Maps raw Supabase / NepalOTP / network / Google OAuth errors to short user-facing copy.
 * Never surface project refs, token codes, or gateway jargon to customers.
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Wrong email or password. Try again.',
  'Invalid login credentials': 'Wrong email or password. Try again.',
  'Email not confirmed': 'Enter the verification code we emailed you.',
  'Please verify your email first.': 'Enter the verification code we emailed you.',
  'User already registered': 'Account already exists. Please login.',
  INVALID_OTP: 'Invalid code. Please try again.',
  'Wrong code': 'Invalid code. Please try again.',
  'invalid otp': 'Invalid code. Please try again.',
  'Token has expired': 'Code expired. Tap resend for a new one.',
  otp_expired: 'Code expired. Tap resend for a new one.',
  OTP_EXPIRED: 'Code expired. Request a new one.',
  'Email rate limit': 'Too many emails sent. Wait a moment.',
  'Email already in use': 'Account already exists. Please login.',
  'Phone number already in use': 'This number is already registered.',
  RATE_LIMITED: 'Please wait a moment before requesting another code.',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please wait.',
  MAX_ATTEMPTS_EXCEEDED: 'Too many attempts. Request a new code.',
  INSUFFICIENT_BALANCE: 'Service temporarily unavailable.',
  weak_password: 'Password too weak. Use 8+ characters.',
  over_email_send_rate_limit: 'Too many emails sent. Wait a moment.',
  network: 'No internet. Check your connection.',
  NETWORK_ERROR: 'No internet connection. Please check your connection and try again.',
  'network request failed': 'No internet connection. Please check your connection and try again.',
  'Failed to fetch': 'No internet connection. Please check your connection and try again.',
  'exchange external code':
    'Google sign-in didn’t finish. Please try again, or use phone or email.',
  'unable to exchange':
    'Google sign-in didn’t finish. Please try again, or use phone or email.',
  'no tokens in callback':
    'Google sign-in didn’t finish. Please try again, or use phone or email.',
  'no valid flow state': 'Google sign-in timed out. Please try again.',
  'code verifier':
    'Google sign-in didn’t finish. Please try again, or use phone or email.',
  'flow state': 'Google sign-in timed out. Please try again.',
  access_denied: 'Google sign-in was cancelled.',
  'user cancelled': 'Google sign-in was cancelled.',
  cancelled: 'Google sign-in was cancelled.',
  nonce: 'Google sign-in isn’t ready yet. Ask support to enable Skip nonce check in Supabase.',
  'Missing EXPO_PUBLIC_GOOGLE':
    'Google sign-in isn’t configured in this build. Please try phone or email instead.',
  'ID token': 'Google sign-in didn’t finish. Please try again, or use phone or email.',
  supabase: 'Couldn’t sign in with Google. Please try phone or email instead.',
  misconfigured: 'Google sign-in isn’t ready yet. Please try phone or email instead.',
  'row-level security': 'Could not save your profile. Please try again.',
  'violates row-level security': 'Could not save your profile. Please try again.',
};
const TECHNICAL_PATTERNS = [
  /supabase\.co/i,
  /exchange external code/i,
  /code_verifier/i,
  /flow state/i,
  /access_token/i,
  /refresh_token/i,
  /pkce/i,
  /\b4\/[0-9A-Za-z_-]+/,
  /redirect_to/i,
  /oauth/i,
  /jwt/i,
  /https?:\/\//i,
];

function errorBlob(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    const withCode = error as Error & { code?: string };
    return [withCode.code, withCode.message].filter(Boolean).join(' ');
  }
  if (typeof error === 'object' && error) {
    const record = error as { code?: unknown; message?: unknown; error?: unknown };
    return [record.code, record.message, record.error].filter(Boolean).map(String).join(' ');
  }
  return String(error ?? '');
}

function looksTechnical(raw: string) {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(raw));
}

export function friendlyAuthError(
  error: unknown,
  fallback = 'Something went wrong. Try again.',
): string {
  const raw = errorBlob(error);
  if (!raw) return fallback;

  const lower = raw.toLowerCase();
  for (const [key, message] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (lower.includes(key.toLowerCase())) return message;
  }

  if (looksTechnical(raw) || raw.length > 80) return fallback;
  return raw;
}

/** Always safe to show in Google Sign-In alerts — never dumps OAuth codes. */
export function friendlyGoogleSignInError(error: unknown): string {
  return friendlyAuthError(
    error,
    'Couldn’t sign in with Google. Please try again, or use phone or email instead.',
  );
}

export function isInvalidCredentialsError(error: unknown): boolean {
  const raw = errorBlob(error).toLowerCase();
  return (
    raw.includes('invalid login credentials') ||
    raw.includes('invalid_credentials') ||
    raw.includes('invalid credentials')
  );
}

export function isEmailAlreadyRegisteredError(error: unknown): boolean {
  const raw = errorBlob(error).toLowerCase();
  return (
    raw.includes('user already registered') ||
    raw.includes('already been registered') ||
    raw.includes('email already in use') ||
    raw.includes('email already registered')
  );
}

export function isNetworkError(error: unknown): boolean {
  const raw = errorBlob(error).toLowerCase();
  return (
    raw.includes('network request failed') ||
    raw.includes('failed to fetch') ||
    raw.includes('network error') ||
    raw.includes('network_error') ||
    raw.includes('no internet')
  );
}

export type OtpFailureKind =
  | 'invalid'
  | 'expired'
  | 'max_attempts'
  | 'rate_limit'
  | 'network'
  | 'other';

export function classifyOtpError(error: unknown): OtpFailureKind {
  const raw = errorBlob(error).toLowerCase();
  if (isNetworkError(error)) return 'network';
  // Don't treat our clearer API-unreachable copy as generic "no internet"
  if (raw.includes('can’t reach lastbag') || raw.includes("can't reach lastbag")) {
    return 'other';
  }
  if (raw.includes('rate_limit') || raw.includes('too many attempts. please wait')) {
    return 'rate_limit';
  }
  if (
    raw.includes('max_attempts') ||
    raw.includes('too many wrong') ||
    raw.includes('too many failed') ||
    raw.includes('request a new code')
  ) {
    return 'max_attempts';
  }
  if (raw.includes('otp_expired') || raw.includes('code expired') || raw.includes('expired')) {
    return 'expired';
  }
  if (
    raw.includes('invalid_otp') ||
    raw.includes('wrong code') ||
    raw.includes('invalid otp') ||
    raw.includes('invalid token')
  ) {
    return 'invalid';
  }
  return 'other';
}

/** Partner support WhatsApp (country code, no +). */
export const PARTNER_SUPPORT_WHATSAPP = '9779716318840';
