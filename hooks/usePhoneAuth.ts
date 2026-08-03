import { useState } from 'react';

import { config } from '@/constants/config';
import { phoneProfileExists, phoneProfileRole } from '@/lib/auth';
import {
  classifyOtpError,
  friendlyAuthError,
  isNetworkError,
} from '@/lib/auth/authErrors';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

type PhoneProfile = {
  id: string;
  role: string | null;
  phone: string | null;
};

export type PhoneAuthFailure = {
  success: false;
  error: string;
  kind: ReturnType<typeof classifyOtpError>;
  retryAfterSeconds?: number;
  code?: string;
  accountExists?: boolean;
  noAccount?: boolean;
  role?: string | null;
};

/** Shared across screens so OTP verify works after navigation. */
let sharedPhoneForVerify: string | null = null;
let sharedOtpId: string | null = null;

function cleanPhone(phone: string) {
  return phone
    .replace(/\s/g, '')
    .replace(/^\+977/, '')
    .replace(/^977/, '')
    .replace(/^0/, '');
}

function readRetryAfter(data: Record<string, unknown>, response: Response): number | undefined {
  const bodyRetry = data.retry_after ?? data.retryAfter;
  if (typeof bodyRetry === 'number' && bodyRetry > 0) return bodyRetry;
  if (typeof bodyRetry === 'string' && Number(bodyRetry) > 0) return Number(bodyRetry);
  const header = response.headers.get('Retry-After');
  if (header && Number(header) > 0) return Number(header);
  return undefined;
}

export function usePhoneAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneForVerify, setPhoneForVerify] = useState<string | null>(
    sharedPhoneForVerify,
  );

  const formatPhone = (phone: string) => `+977${cleanPhone(phone)}`;

  const validatePhone = (phone: string) => /^(97|98)\d{8}$/.test(cleanPhone(phone));

  const sendOTP = async (phone: string, mode: 'signup' | 'login' = 'signup') => {
    setLoading(true);
    setError(null);

    try {
      if (!validatePhone(phone)) {
        throw new Error('Enter a valid NTC or Ncell number');
      }

      const formatted = formatPhone(phone);

      // Gate before SMS so signup/login never waste an OTP on the wrong path.
      try {
        const exists = await phoneProfileExists(formatted);
        if (mode === 'signup' && exists) {
          let role: string | null = null;
          try {
            role = await phoneProfileRole(formatted);
          } catch {
            role = null;
          }
          const message = 'This number is already registered. Please login instead.';
          setError(message);
          return {
            success: false as const,
            accountExists: true as const,
            role,
            error: message,
            kind: 'other' as const,
          };
        }

        if (mode === 'login' && !exists) {
          const message = 'No account found with this number. Please sign up first.';
          setError(message);
          return {
            success: false as const,
            noAccount: true as const,
            error: message,
            kind: 'other' as const,
          };
        }
      } catch (lookupError) {
        // RPC may be missing in older envs — still attempt OTP rather than hard-block.
        console.warn('[phone-auth] phone lookup failed, continuing to OTP:', lookupError);
      }

      let response: Response;
      try {
        response = await fetch(`${config.apiUrl}/api/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formatted }),
        });
      } catch (err) {
        const message = friendlyAuthError(
          err,
          'No internet connection. Please check your connection and try again.',
        );
        setError(message);
        return {
          success: false as const,
          error: message,
          kind: 'network' as const,
        };
      }

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok || !data.success) {
        const code = typeof data.code === 'string' ? data.code : undefined;
        const retryAfterSeconds = readRetryAfter(data, response);
        const message =
          code === 'RATE_LIMIT_EXCEEDED' || response.status === 429
            ? retryAfterSeconds
              ? `Too many attempts. Please wait before requesting a new code. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`
              : 'Too many attempts. Please wait before requesting a new code.'
            : friendlyAuthError(
                { code, message: data.error },
                typeof data.error === 'string' ? data.error : 'Failed to send OTP',
              );

        setError(message);
        return {
          success: false as const,
          error: message,
          kind: classifyOtpError({ code, message }),
          retryAfterSeconds,
          code,
        };
      }

      sharedPhoneForVerify = formatted;
      sharedOtpId = typeof data.otp_id === 'string' ? data.otp_id : null;
      setPhoneForVerify(formatted);
      return { success: true as const };
    } catch (err: unknown) {
      const message = friendlyAuthError(
        err,
        isNetworkError(err)
          ? 'No internet connection. Please check your connection and try again.'
          : 'Failed to send OTP',
      );
      setError(message);
      return {
        success: false as const,
        error: message,
        kind: classifyOtpError(err),
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (
    code: string,
    userData: {
      name: string;
      phone: string;
      email?: string | null;
      role: UserRole;
    },
    options?: { mode?: 'login' | 'signup' },
  ) => {
    const phone = sharedPhoneForVerify || phoneForVerify || formatPhone(userData.phone);

    if (!phone) {
      return {
        success: false as const,
        error: 'No phone number to verify',
        kind: 'other' as const,
      };
    }

    setLoading(true);
    setError(null);

    try {
      if (!sharedOtpId) {
        throw new Error('Missing verification session. Please request a new code.');
      }

      let response: Response;
      try {
        response = await fetch(`${config.apiUrl}/api/otp/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code, otp_id: sharedOtpId }),
        });
      } catch (err) {
        const message = friendlyAuthError(
          err,
          'No internet connection. Please check your connection and try again.',
        );
        setError(message);
        return {
          success: false as const,
          error: message,
          kind: 'network' as const,
        };
      }

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok || !data.success) {
        const apiCode = typeof data.code === 'string' ? data.code : undefined;
        const message = friendlyAuthError(
          { code: apiCode, message: data.error },
          typeof data.error === 'string' ? data.error : 'Invalid OTP',
        );
        setError(message);
        return {
          success: false as const,
          error: message,
          kind: classifyOtpError({ code: apiCode, message }),
          code: apiCode,
        };
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: String(data.access_token ?? ''),
        refresh_token: String(data.refresh_token ?? ''),
      });

      if (sessionError) throw sessionError;

      const mode = options?.mode ?? 'signup';
      const existing = (data.profile ?? null) as PhoneProfile | null;

      if (existing) {
        sharedPhoneForVerify = null;
        sharedOtpId = null;
        setPhoneForVerify(null);
        return {
          success: true as const,
          isNewUser: false as const,
          profile: existing,
        };
      }

      // Login with a number that has no profile yet — drop the ghost session.
      if (mode === 'login') {
        await supabase.auth.signOut();
        sharedPhoneForVerify = null;
        sharedOtpId = null;
        setPhoneForVerify(null);
        return {
          success: true as const,
          isNewUser: true as const,
          profile: null,
        };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Could not start your session');

      const displayName = userData.name?.trim();
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: displayName && displayName !== 'Customer' ? displayName : null,
        phone,
        email: userData.email || null,
        role: userData.role,
        terms_accepted_at: new Date().toISOString(),
        terms_version: 'v1.0',
        onboarding_completed: false,
      });

      if (profileError) throw profileError;

      sharedPhoneForVerify = null;
      sharedOtpId = null;
      setPhoneForVerify(null);

      return {
        success: true as const,
        isNewUser: true as const,
        userId: user.id,
        role: userData.role,
        needsProfileName: !displayName || displayName === 'Customer',
      };
    } catch (err: unknown) {
      const message = friendlyAuthError(err, 'Verification failed');
      setError(message);
      return {
        success: false as const,
        error: message,
        kind: classifyOtpError(err),
      };
    } finally {
      setLoading(false);
    }
  };

  const resetOtp = () => {
    sharedPhoneForVerify = null;
    sharedOtpId = null;
    setPhoneForVerify(null);
    setError(null);
  };

  return {
    sendOTP,
    verifyOTP,
    resetOtp,
    loading,
    error,
    setError,
    formatPhone,
    validatePhone,
    phoneForVerify,
  };
}
