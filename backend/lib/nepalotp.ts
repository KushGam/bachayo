const NEPALOTP_BASE_URL = process.env.NEPALOTP_BASE_URL ?? 'https://api.nepalotp.com/v1';

export type NepalOtpErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'MAX_ATTEMPTS_EXCEEDED'
  | 'OTP_NOT_FOUND';

export class NepalOtpError extends Error {
  readonly code: string | undefined;
  readonly status: number;

  constructor(message: string, code: string | undefined, status: number) {
    super(message);
    this.name = 'NepalOtpError';
    this.code = code;
    this.status = status;
  }
}

/** Strips +977 / 977 / leading 0 so we always send E.164 to the gateway. */
export function normalizeNepalPhone(phone: string) {
  return phone
    .replace(/\s/g, '')
    .replace(/^\+977/, '')
    .replace(/^977/, '')
    .replace(/^0/, '');
}

export function isValidNepalMobile(phone: string) {
  return /^(97|98)\d{8}$/.test(normalizeNepalPhone(phone));
}

export function toE164NepalPhone(phone: string) {
  return `+977${normalizeNepalPhone(phone)}`;
}

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.NEPALOTP_API_KEY;
  if (!apiKey) {
    throw new NepalOtpError('OTP service is not configured', 'MISSING_API_KEY', 503);
  }

  const response = await fetch(`${NEPALOTP_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  let payload: Record<string, unknown> = {};
  if (raw) {
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const code = typeof payload.code === 'string' ? payload.code : undefined;
    const message =
      typeof payload.error === 'string'
        ? payload.error
        : typeof payload.message === 'string'
          ? payload.message
          : `OTP request failed (${response.status})`;
    throw new NepalOtpError(message, code, response.status);
  }

  return payload as T;
}

export function sendOtp(phone: string) {
  return request<{ otp_id?: string }>('/otp/send', {
    phone: toE164NepalPhone(phone),
    channel: 'sms',
  });
}

export function verifyOtp(phone: string, code: string) {
  return request<{ verified?: boolean }>('/otp/verify', {
    phone: toE164NepalPhone(phone),
    code,
  });
}
