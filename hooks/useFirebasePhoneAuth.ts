import { useCallback, useRef, useState } from 'react';
import {
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';

import { firebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

const FIREBASE_NOT_CONFIGURED =
  'Phone auth is not configured yet. Add Firebase keys to .env.local.';

/** Shared across screens so OTP verify works after navigation. */
let sharedVerificationId: string | null = null;

export function getSharedFirebaseVerificationId() {
  return sharedVerificationId;
}

export function setSharedFirebaseVerificationId(id: string | null) {
  sharedVerificationId = id;
}

function phoneEmailFromFormatted(formattedPhone: string) {
  return `${formattedPhone.replace(/\D/g, '')}@lastbag.phone`;
}

export function useFirebasePhoneAuth() {
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(
    sharedVerificationId,
  );
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifier = useRef<any>(null);

  const formatPhone = useCallback((phone: string) => {
    const clean = phone
      .replace(/\s/g, '')
      .replace(/^\+977/, '')
      .replace(/^977/, '')
      .replace(/^0/, '');
    return `+977${clean}`;
  }, []);

  const validatePhone = useCallback((phone: string) => {
    const clean = phone
      .replace(/\s/g, '')
      .replace(/^\+977/, '')
      .replace(/^977/, '')
      .replace(/^0/, '');
    return /^(97|98)\d{8}$/.test(clean);
  }, []);

  const sendOTP = useCallback(
    async (phone: string) => {
      setLoading(true);
      setError(null);

      try {
        if (!isFirebaseConfigured || !firebaseAuth) {
          throw new Error(FIREBASE_NOT_CONFIGURED);
        }

        if (!validatePhone(phone)) {
          throw new Error(
            'Enter a valid NTC or Ncell number (starts with 97 or 98)',
          );
        }

        if (!recaptchaVerifier.current) {
          throw new Error('Verification UI is not ready. Please try again.');
        }

        const formatted = formatPhone(phone);
        const provider = new PhoneAuthProvider(firebaseAuth);
        const vid = await provider.verifyPhoneNumber(
          formatted,
          recaptchaVerifier.current,
        );

        sharedVerificationId = vid;
        setVerificationId(vid);
        return { success: true as const };
      } catch (err: unknown) {
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code?: string }).code)
            : '';
        const messages: Record<string, string> = {
          'auth/invalid-phone-number': 'Invalid phone number format.',
          'auth/too-many-requests': 'Too many attempts. Try again later.',
          'auth/quota-exceeded': 'SMS limit reached. Try again tomorrow.',
          'auth/captcha-check-failed': 'Verification failed. Try again.',
        };

        const message =
          messages[code] ||
          (err instanceof Error ? err.message : null) ||
          'Failed to send OTP.';

        setError(message);
        return { success: false as const, error: message };
      } finally {
        setLoading(false);
      }
    },
    [formatPhone, validatePhone],
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
      const activeVerificationId = sharedVerificationId || verificationId;
      if (!activeVerificationId) {
        return {
          success: false as const,
          error: 'No verification in progress. Please request a new code.',
        };
      }

      if (!isFirebaseConfigured || !firebaseAuth) {
        return {
          success: false as const,
          error: FIREBASE_NOT_CONFIGURED,
        };
      }

      setLoading(true);
      setError(null);

      try {
        const credential = PhoneAuthProvider.credential(
          activeVerificationId,
          code,
        );
        const result = await signInWithCredential(firebaseAuth, credential);
        const firebaseUser = result.user;
        const formattedPhone = formatPhone(userData.phone);
        const phoneEmail = phoneEmailFromFormatted(formattedPhone);
        const mode = options?.mode ?? 'signup';

        const { data: existing } = await supabase
          .from('profiles')
          .select('id, role, phone')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (existing) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: phoneEmail,
            password: firebaseUser.uid,
          });

          if (signInError) {
            // Profile exists from an older auth path — update link and ask password login.
            await supabase
              .from('profiles')
              .update({ firebase_uid: firebaseUser.uid } as never)
              .eq('id', existing.id);

            throw new Error(
              'This number is registered. Please log in with email or password.',
            );
          }

          await supabase
            .from('profiles')
            .update({ firebase_uid: firebaseUser.uid } as never)
            .eq('id', existing.id);

          sharedVerificationId = null;
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

        if (mode === 'login') {
          return {
            success: true as const,
            isNewUser: true as const,
            profile: null,
          };
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: phoneEmail,
          password: firebaseUser.uid,
          options: {
            data: {
              full_name: userData.name,
              phone: formattedPhone,
              role: userData.role,
              firebase_uid: firebaseUser.uid,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            full_name: userData.name,
            phone: formattedPhone,
            email: userData.email?.trim() || null,
            role: userData.role,
            firebase_uid: firebaseUser.uid,
            terms_accepted_at: userData.termsAccepted
              ? new Date().toISOString()
              : null,
            terms_version: 'v1.0',
            onboarding_completed: false,
          } as never);

          if (profileError) throw profileError;
        }

        sharedVerificationId = null;
        setVerificationId(null);

        return {
          success: true as const,
          isNewUser: true as const,
          userId: authData.user?.id,
          role: userData.role,
        };
      } catch (err: unknown) {
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code?: string }).code)
            : '';
        const messages: Record<string, string> = {
          'auth/invalid-verification-code':
            'Wrong code. Please check and try again.',
          'auth/code-expired': 'Code expired. Request a new one.',
          'auth/session-expired': 'Session expired. Please start again.',
        };

        const message =
          messages[code] ||
          (err instanceof Error ? err.message : null) ||
          'Verification failed. Try again.';

        setError(message);
        return { success: false as const, error: message };
      } finally {
        setLoading(false);
      }
    },
    [formatPhone, verificationId],
  );

  return {
    sendOTP,
    verifyOTP,
    loading,
    error,
    verificationId,
    recaptchaVerifier,
    setError,
    formatPhone,
    validatePhone,
  };
}
