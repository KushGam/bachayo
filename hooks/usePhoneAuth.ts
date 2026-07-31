import { useState } from 'react';

import { config } from '@/constants/config';
import { friendlyAuthError } from '@/lib/auth/authErrors';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

type PhoneProfile = {
  id: string;
  role: string | null;
  phone: string | null;
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

export function usePhoneAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneForVerify, setPhoneForVerify] = useState<string | null>(
    sharedPhoneForVerify,
  );

  const formatPhone = (phone: string) => `+977${cleanPhone(phone)}`;

  const validatePhone = (phone: string) => /^(97|98)\d{8}$/.test(cleanPhone(phone));

  const sendOTP = async (phone: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!validatePhone(phone)) {
        throw new Error('Enter a valid NTC or Ncell number');
      }

      const formatted = formatPhone(phone);

      const response = await fetch(`${config.apiUrl}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      sharedPhoneForVerify = formatted;
      sharedOtpId = typeof data.otp_id === 'string' ? data.otp_id : null;
      setPhoneForVerify(formatted);
      return { success: true as const };
    } catch (err: any) {
      const message = friendlyAuthError(err, 'Failed to send OTP');
      setError(message);
      return { success: false as const, error: message };
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
      };
    }

    setLoading(true);
    setError(null);

    try {
      if (!sharedOtpId) {
        throw new Error('Missing verification session. Please request a new code.');
      }

      const response = await fetch(`${config.apiUrl}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, otp_id: sharedOtpId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP');
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
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

      if (mode === 'login') {
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

      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: userData.name,
        phone,
        email: userData.email || null,
        role: userData.role,
        terms_accepted_at: new Date().toISOString(),
        terms_version: 'v1.0',
        onboarding_completed: false,
      });

      sharedPhoneForVerify = null;
      sharedOtpId = null;
      setPhoneForVerify(null);

      return {
        success: true as const,
        isNewUser: true as const,
        userId: user.id,
        role: userData.role,
      };
    } catch (err: any) {
      const message = friendlyAuthError(err, 'Verification failed');
      setError(message);
      return { success: false as const, error: message };
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
