import { useCallback, useState } from 'react';

import { formatNepalPhone, sendPhoneOtp, verifyPhoneOtp } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

/** Tracks that an OTP was requested this session (Supabase does not expose a verificationId). */
let sharedOtpPendingPhone: string | null = null;

export function getSharedFirebaseVerificationId() {
  return sharedOtpPendingPhone;
}

export function setSharedFirebaseVerificationId(id: string | null) {
  sharedOtpPendingPhone = id;
}

function digitsOnly(phone: string) {
  return phone
    .replace(/\s/g, '')
    .replace(/^\+977/, '')
    .replace(/^977/, '')
    .replace(/^0/, '');
}

export function useFirebasePhoneAuth() {
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(
    sharedOtpPendingPhone,
  );
  const [error, setError] = useState<string | null>(null);

  const formatPhone = useCallback((phone: string) => {
    return formatNepalPhone(digitsOnly(phone));
  }, []);

  const validatePhone = useCallback((phone: string) => {
    return /^(97|98)\d{8}$/.test(digitsOnly(phone));
  }, []);

  const sendOTP = useCallback(
    async (phone: string) => {
      setLoading(true);
      setError(null);

      try {
        if (!validatePhone(phone)) {
          throw new Error(
            'Enter a valid NTC or Ncell number (starts with 97 or 98)',
          );
        }

        const digits = digitsOnly(phone);
        const { error: otpError } = await sendPhoneOtp(digits);
        if (otpError) throw otpError;

        sharedOtpPendingPhone = digits;
        setVerificationId(digits);
        return { success: true as const };
      } catch (err: unknown) {
        const message =
          (err instanceof Error ? err.message : null) || 'Failed to send OTP.';
        setError(message);
        return { success: false as const, error: message };
      } finally {
        setLoading(false);
      }
    },
    [validatePhone],
  );

  const verifyOTP = useCallback(
    async (
      code: string,
      userData: {
        name: string;
        phone: string;
        email?: string | null;
        role: string;
        termsAccepted: boolean;
      },
      options?: { mode?: 'login' | 'signup' },
    ) => {
      const digits = digitsOnly(userData.phone);
      if (!sharedOtpPendingPhone && !verificationId) {
        return {
          success: false as const,
          error: 'No verification in progress. Please request a new code.',
        };
      }

      setLoading(true);
      setError(null);

      try {
        const mode = options?.mode ?? 'signup';
        const formattedPhone = formatNepalPhone(digits);
        const { data, error: verifyError } = await verifyPhoneOtp(digits, code);
        if (verifyError) throw verifyError;

        const userId = data.user?.id;
        if (!userId) {
          throw new Error('Could not verify your session.');
        }

        const { data: existing } = await supabase
          .from('profiles')
          .select('id, role, phone')
          .eq('id', userId)
          .maybeSingle();

        if (existing) {
          sharedOtpPendingPhone = null;
          setVerificationId(null);

          return {
            success: true as const,
            isNewUser: false as const,
            userId: existing.id,
            profile: existing as {
              id: string;
              role: UserRole | null;
              phone: string | null;
            },
          };
        }

        // Also check by phone in case auth user is new but profile exists under another id
        const { data: byPhone } = await supabase
          .from('profiles')
          .select('id, role, phone')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (byPhone) {
          sharedOtpPendingPhone = null;
          setVerificationId(null);

          return {
            success: true as const,
            isNewUser: false as const,
            userId: byPhone.id,
            profile: byPhone as {
              id: string;
              role: UserRole | null;
              phone: string | null;
            },
          };
        }

        if (mode === 'login') {
          return {
            success: true as const,
            isNewUser: true as const,
            profile: null,
          };
        }

        const { error: profileError } = await supabase.from('profiles').upsert({
          id: userId,
          full_name: userData.name,
          phone: formattedPhone,
          email: userData.email?.trim() || null,
          role: userData.role,
          terms_accepted_at: userData.termsAccepted
            ? new Date().toISOString()
            : null,
          terms_version: 'v1.0',
          onboarding_completed: false,
        } as never);

        if (profileError) throw profileError;

        sharedOtpPendingPhone = null;
        setVerificationId(null);

        return {
          success: true as const,
          isNewUser: true as const,
          userId,
          role: userData.role,
        };
      } catch (err: unknown) {
        const message =
          (err instanceof Error ? err.message : null) ||
          'Verification failed. Try again.';
        setError(message);
        return { success: false as const, error: message };
      } finally {
        setLoading(false);
      }
    },
    [verificationId],
  );

  return {
    sendOTP,
    verifyOTP,
    loading,
    error,
    verificationId,
    setError,
    formatPhone,
    validatePhone,
  };
}
