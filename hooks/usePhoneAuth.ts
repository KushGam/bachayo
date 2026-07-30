import { useState } from 'react';

import { supabase } from '@/lib/supabase';

/** Shared across screens so OTP verify works after navigation. */
let sharedPhoneForVerify: string | null = null;

export function usePhoneAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneForVerify, setPhoneForVerify] = useState<string | null>(
    sharedPhoneForVerify,
  );

  const formatPhone = (phone: string) => {
    const clean = phone
      .replace(/\s/g, '')
      .replace(/^\+977/, '')
      .replace(/^977/, '')
      .replace(/^0/, '');
    return '+977' + clean;
  };

  const validatePhone = (phone: string) => {
    const clean = phone
      .replace(/\s/g, '')
      .replace(/^\+977/, '')
      .replace(/^977/, '')
      .replace(/^0/, '');
    return /^(97|98)\d{8}$/.test(clean);
  };

  const sendOTP = async (phone: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!validatePhone(phone)) {
        throw new Error('Enter a valid NTC or Ncell number');
      }

      const formatted = formatPhone(phone);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formatted,
      });

      if (otpError) throw otpError;

      sharedPhoneForVerify = formatted;
      setPhoneForVerify(formatted);
      return { success: true as const };
    } catch (err: any) {
      const message = err.message || 'Failed to send OTP';
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
      role: string;
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
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      const user = data.user!;
      const mode = options?.mode ?? 'signup';

      const { data: existing } = await supabase
        .from('profiles')
        .select('id, role, approval_status, phone')
        .eq('id', user.id)
        .maybeSingle();

      if (existing) {
        sharedPhoneForVerify = null;
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

      const formatted = formatPhone(userData.phone);

      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: userData.name,
        phone: formatted,
        email: userData.email || null,
        role: userData.role,
        terms_accepted_at: new Date().toISOString(),
        terms_version: 'v1.0',
        onboarding_completed: false,
      });

      sharedPhoneForVerify = null;
      setPhoneForVerify(null);

      return {
        success: true as const,
        isNewUser: true as const,
        userId: user.id,
        role: userData.role,
      };
    } catch (err: any) {
      const message = err.message || 'Verification failed';
      setError(message);
      return { success: false as const, error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendOTP,
    verifyOTP,
    loading,
    error,
    setError,
    formatPhone,
    validatePhone,
    phoneForVerify,
  };
}
