/**
 * Maps raw Supabase / NepalOTP / network errors to short user-facing copy.
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Wrong email or password. Try again.',
  'Invalid login credentials': 'Wrong email or password. Try again.',
  'Email not confirmed': 'Please verify your email first.',
  'User already registered': 'Account already exists. Please login.',
  'Email already in use': 'Account already exists. Please login.',
  'Phone number already in use': 'This number is already registered.',
  INVALID_OTP: 'Wrong code. Please try again.',
  OTP_EXPIRED: 'Code expired. Request a new one.',
  MAX_ATTEMPTS_EXCEEDED: 'Too many attempts. Request a new code.',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please wait.',
  INSUFFICIENT_BALANCE: 'Service temporarily unavailable.',
  weak_password: 'Password too weak. Use 8+ characters.',
  over_email_send_rate_limit: 'Too many emails sent. Wait a moment.',
  network: 'No internet. Check your connection.',
  NETWORK_ERROR: 'No internet connection. Please check your connection and try again.',
  'network request failed': 'No internet connection. Please check your connection and try again.',
  'Failed to fetch': 'No internet connection. Please check your connection and try again.',
};

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

  return raw.length < 120 ? raw : fallback;
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
export const PARTNER_SUPPORT_WHATSAPP = '9779762623241';
