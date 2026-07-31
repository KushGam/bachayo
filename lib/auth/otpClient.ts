import { config } from '@/constants/config';

export type OtpResult = { success: true } | { success: false; error: string };

async function postOtp(path: string, body: Record<string, unknown>): Promise<OtpResult> {
  try {
    const response = await fetch(`${config.apiUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Something went wrong.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'No internet connection. Please check your network.' };
  }
}

/** Confirms the code without issuing a session — for users who are already signed in. */
export function confirmPhoneOtpOnly(phoneE164: string, code: string, otpId: string) {
  return postOtp('/api/otp/verify', {
    phone: phoneE164,
    code,
    otp_id: otpId,
    intent: 'verify_only',
  });
}

export type SendOtpResult =
  | { success: true; otp_id: string }
  | { success: false; error: string };

export async function requestPhoneOtpDetailed(phoneE164: string): Promise<SendOtpResult> {
  try {
    const response = await fetch(`${config.apiUrl}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneE164 }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || typeof data.otp_id !== 'string') {
      return { success: false, error: data.error || 'Something went wrong.' };
    }
    return { success: true, otp_id: data.otp_id };
  } catch {
    return { success: false, error: 'No internet connection. Please check your network.' };
  }
}
