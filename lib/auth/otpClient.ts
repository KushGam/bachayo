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

export function requestPhoneOtp(phoneE164: string) {
  return postOtp('/api/otp/send', { phone: phoneE164 });
}

/** Confirms the code without issuing a session — for users who are already signed in. */
export function confirmPhoneOtpOnly(phoneE164: string, code: string) {
  return postOtp('/api/otp/verify', { phone: phoneE164, code, intent: 'verify_only' });
}
