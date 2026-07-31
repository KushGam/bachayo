const NEPALOTP_BASE_URL = process.env.NEPALOTP_BASE_URL ?? 'https://api.nepalotp.com/v1';

export type NepalOtpErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'MAX_ATTEMPTS_EXCEEDED'
  | 'OTP_NOT_FOUND'
  | 'INVALID_PHONE_FORMAT'
  | 'INVALID_API_KEY'
  | 'MISSING_API_KEY'
  | 'NETWORK_ERROR';

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

type SendResult = { otp_id: string; phone: string; expires_at?: string };
type VerifyResult = { verified: boolean; phone?: string };

/** Strips +977 / 977 / leading 0 → 10-digit local form NepalOTP expects. */
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

function isTestApiKey(apiKey: string) {
  return (
    apiKey.startsWith('npot_test') ||
    apiKey.startsWith('notp_sandbox') ||
    apiKey.startsWith('npot_tes')
  );
}

function readError(payload: Record<string, unknown>, status: number) {
  const nested = payload.error;
  if (nested && typeof nested === 'object') {
    const err = nested as Record<string, unknown>;
    const code = typeof err.code === 'string' ? err.code : undefined;
    const message =
      typeof err.message === 'string' ? err.message : `OTP request failed (${status})`;
    return { code, message };
  }

  const code = typeof payload.code === 'string' ? payload.code : undefined;
  const message =
    typeof payload.error === 'string'
      ? payload.error
      : typeof payload.message === 'string'
        ? payload.message
        : `OTP request failed (${status})`;
  return { code, message };
}

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.NEPALOTP_API_KEY;
  if (!apiKey) {
    throw new NepalOtpError('OTP service is not configured', 'MISSING_API_KEY', 503);
  }

  let response: Response;
  try {
    response = await fetch(`${NEPALOTP_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'network error';
    throw new NepalOtpError(
      `Cannot reach NepalOTP (${detail}). Check api.nepalotp.com DNS / NEPALOTP_BASE_URL.`,
      'NETWORK_ERROR',
      503,
    );
  }

  const raw = await response.text();
  let payload: Record<string, unknown> = {};
  if (raw) {
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok || payload.success === false) {
    const { code, message } = readError(payload, response.status);
    throw new NepalOtpError(message, code, response.status >= 400 ? response.status : 400);
  }

  // Docs wrap payloads in `{ success, data }`; tolerate flat responses too.
  const data = (payload.data as T | undefined) ?? (payload as T);
  return data;
}

function offlineSend(phoneLocal: string): SendResult {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  // Stateless id so Vercel serverless can verify without shared memory.
  const payload = Buffer.from(
    JSON.stringify({ p: phoneLocal, e: expiresAt }),
    'utf8',
  ).toString('base64url');
  const otp_id = `otp_offline_${payload}`;
  console.warn(
    `[NepalOTP] Offline sandbox send for ${phoneLocal} — use code 123456 (API unreachable)`,
  );
  return {
    otp_id,
    phone: phoneLocal,
    expires_at: new Date(expiresAt).toISOString(),
  };
}

function offlineVerify(otpId: string, code: string): VerifyResult {
  if (!otpId.startsWith('otp_offline_')) {
    throw new NepalOtpError('The specified otp_id does not exist', 'OTP_NOT_FOUND', 404);
  }

  try {
    const raw = Buffer.from(otpId.slice('otp_offline_'.length), 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as { p?: string; e?: number };
    if (!parsed.p || !parsed.e) {
      throw new Error('bad payload');
    }
    if (Date.now() > parsed.e) {
      throw new NepalOtpError('The OTP has expired. Request a new one.', 'OTP_EXPIRED', 400);
    }
    if (code !== '123456') {
      throw new NepalOtpError('The code is incorrect', 'INVALID_OTP', 400);
    }
    return { verified: true, phone: parsed.p };
  } catch (error) {
    if (error instanceof NepalOtpError) throw error;
    throw new NepalOtpError('The specified otp_id does not exist', 'OTP_NOT_FOUND', 404);
  }
}

/**
 * NepalOTP docs: phone is 10-digit local (97/98…), not E.164.
 * Sandbox / test keys always use code 123456 when the live API is down.
 */
export async function sendOtp(phone: string): Promise<SendResult> {
  const apiKey = process.env.NEPALOTP_API_KEY ?? '';
  const phoneLocal = normalizeNepalPhone(phone);

  try {
    const data = await request<Partial<SendResult> & { id?: string }>('/otp/send', {
      phone: phoneLocal,
      channel: 'sms',
    });

    const otp_id = data.otp_id ?? data.id;
    if (!otp_id) {
      throw new NepalOtpError('OTP provider returned no otp_id', 'INTERNAL_ERROR', 502);
    }

    return {
      otp_id,
      phone: data.phone ?? phoneLocal,
      expires_at: data.expires_at,
    };
  } catch (error) {
    if (
      error instanceof NepalOtpError &&
      error.code === 'NETWORK_ERROR' &&
      isTestApiKey(apiKey)
    ) {
      return offlineSend(phoneLocal);
    }
    throw error;
  }
}

/** Docs require otp_id + code (not phone + code). */
export async function verifyOtp(otpId: string, code: string): Promise<VerifyResult> {
  const apiKey = process.env.NEPALOTP_API_KEY ?? '';

  if (otpId.startsWith('otp_offline_') && isTestApiKey(apiKey)) {
    return offlineVerify(otpId, code);
  }

  try {
    const data = await request<Partial<VerifyResult>>('/otp/verify', {
      otp_id: otpId,
      code,
    });
    return { verified: data.verified !== false, phone: data.phone };
  } catch (error) {
    if (
      error instanceof NepalOtpError &&
      error.code === 'NETWORK_ERROR' &&
      isTestApiKey(apiKey)
    ) {
      return offlineVerify(otpId, code);
    }
    throw error;
  }
}
