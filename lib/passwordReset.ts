import { config } from '@/constants/config';

type ApiError = { message: string; code?: string };

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const baseUrl = config.apiUrl?.replace(/\/$/, '');
  if (!baseUrl) {
    throw Object.assign(new Error('API URL is not configured'), { code: 'NO_API_URL' });
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  } & T;

  if (!response.ok) {
    const err: ApiError = {
      message: payload.error || 'Request failed',
      code: payload.code,
    };
    throw err;
  }

  return payload;
}

let pendingReset: { email: string; resetToken: string } | null = null;

export function getPendingPasswordReset() {
  return pendingReset;
}

export function clearPendingPasswordReset() {
  pendingReset = null;
}

export async function requestPasswordReset(email: string) {
  try {
    await postJson('/api/auth/password-reset/send', {
      email: email.trim().toLowerCase(),
    });
    return { error: null };
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as ApiError).message)
        : 'Could not send reset code.';
    return { error: { message } };
  }
}

export async function verifyPasswordRecoveryOtp(email: string, token: string) {
  try {
    const result = await postJson<{
      email: string;
      reset_token: string;
    }>('/api/auth/password-reset/verify', {
      email: email.trim().toLowerCase(),
      code: token.trim(),
    });
    pendingReset = {
      email: result.email,
      resetToken: result.reset_token,
    };
    return { data: { ok: true }, error: null };
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as ApiError).message)
        : 'Invalid or expired code.';
    return { data: null, error: { message } };
  }
}

export async function confirmPasswordResetWithToken(password: string) {
  if (!pendingReset?.resetToken) {
    return {
      error: { message: 'Reset session expired. Request a new code.' },
      session: null as null,
      email: null as string | null,
    };
  }

  try {
    const result = await postJson<{
      email: string;
      user_id: string;
      access_token: string | null;
      refresh_token: string | null;
    }>('/api/auth/password-reset/confirm', {
      reset_token: pendingReset.resetToken,
      password,
    });

    const email = result.email;
    clearPendingPasswordReset();

    return {
      error: null,
      email,
      session:
        result.access_token && result.refresh_token
          ? {
              access_token: result.access_token,
              refresh_token: result.refresh_token,
            }
          : null,
    };
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as ApiError).message)
        : 'Could not update password.';
    return { error: { message }, session: null, email: null };
  }
}
