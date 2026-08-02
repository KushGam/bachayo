import type { Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { config } from '@/constants/config';
import { signInWithGoogle as signInWithGoogleNative } from '@/lib/auth/googleSignIn';
import { friendlyGoogleSignInError } from '@/lib/auth/authErrors';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { hasAcceptedTerms } from '@/lib/terms';
import type { UserRole } from '@/types/database';

WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInResult =
  | { status: 'cancelled' }
  | { status: 'expo_go' }
  | { status: 'success'; userId: string; hasProfile: boolean };

export type NavigateAfterGoogleResult =
  | { ok: false; cancelled: true; expoGo?: boolean }
  | { ok: true; cancelled: false; needsTerms: true; userId: string }
  | { ok: true; cancelled: false; needsTerms: false };

export async function createSessionFromUrl(url: string) {
  const hashParams = new URLSearchParams(url.split('#')[1] || '');
  const queryString = url.split('?')[1]?.split('#')[0] || '';
  const queryParams = new URLSearchParams(queryString);

  const errorCode = queryParams.get('error') || hashParams.get('error');
  if (errorCode) {
    throw new Error(errorCode);
  }

  const code = queryParams.get('code') || hashParams.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  const accessToken =
    hashParams.get('access_token') || queryParams.get('access_token');
  const refreshToken =
    hashParams.get('refresh_token') || queryParams.get('refresh_token');

  if (accessToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });
    if (error) throw error;
    return data.session;
  }

  throw new Error('No auth credentials returned');
}

/** True when the deep link is a password-recovery handoff from Supabase. */
export function isPasswordRecoveryUrl(url: string) {
  const hashParams = new URLSearchParams(url.split('#')[1] || '');
  const queryString = url.split('?')[1]?.split('#')[0] || '';
  const queryParams = new URLSearchParams(queryString);
  const type = queryParams.get('type') || hashParams.get('type');
  return type === 'recovery';
}

export function getPasswordResetRedirectUri() {
  // Kept for legacy magic-link templates / web bridge.
  const base = (config.apiUrl || 'https://lastbag.app').replace(/\/$/, '');
  return `${base}/auth/reset`;
}

export {
  confirmPasswordResetWithToken,
  clearPendingPasswordReset,
  getPendingPasswordReset,
  requestPasswordReset,
  verifyPasswordRecoveryOtp,
} from '@/lib/passwordReset';


export async function fetchUserRole(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.role ?? null;
}

export async function hasUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, phone')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.phone);
}

export async function phoneProfileExists(phoneDigits: string) {
  const { data, error } = await supabase.rpc('phone_profile_exists', {
    p_phone: formatNepalPhone(phoneDigits),
  });

  if (error) throw error;
  return Boolean(data);
}

export async function fetchProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function navigateAfterGoogleSignIn(
  router: { replace: (href: Href) => void },
  setAuthRole: (role: UserRole | null) => void,
): Promise<NavigateAfterGoogleResult> {
  const result = await signInWithGoogle();

  if (result.status === 'expo_go') {
    return { ok: false as const, cancelled: true, expoGo: true };
  }

  if (result.status === 'cancelled') {
    return { ok: false as const, cancelled: true };
  }

  if (result.hasProfile) {
    const accepted = await hasAcceptedTerms(result.userId);
    if (!accepted) {
      return { ok: true as const, cancelled: false, needsTerms: true, userId: result.userId };
    }

    const role = await fetchUserRole(result.userId);
    setAuthRole(role ?? 'customer');
    router.replace(await resolveAuthenticatedRoute(result.userId, role ?? 'customer'));
    return { ok: true as const, cancelled: false, needsTerms: false };
  }

  router.replace('/(auth)/complete-profile');
  return { ok: true as const, cancelled: false, needsTerms: false };
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const result = await signInWithGoogleNative();

  if ('expoGo' in result && result.expoGo) {
    return { status: 'expo_go' };
  }

  if ('cancelled' in result && result.cancelled) {
    // iOS sometimes dismisses the auth sheet after the deep link already signed us in.
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const hasProfile = await hasUserProfile(data.session.user.id);
      return {
        status: 'success',
        userId: data.session.user.id,
        hasProfile,
      };
    }
    return { status: 'cancelled' };
  }

  if (!result.success || !('user' in result) || !result.user) {
    const technical =
      'error' in result && result.error instanceof Error
        ? result.error
        : new Error('Google sign-in failed');
    console.error('[Google] Sign-in failed:', technical);
    throw new Error(friendlyGoogleSignInError(technical));
  }

  const hasProfile = await hasUserProfile(result.user.id);

  return {
    status: 'success',
    userId: result.user.id,
    hasProfile,
  };
}

export function formatNepalPhone(digits: string) {
  return `+977${digits}`;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function emailProfileExists(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const { data, error } = await supabase.rpc('email_profile_exists', {
    p_email: normalized,
  });

  if (error) throw error;
  return Boolean(data);
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
  });
}

/**
 * Sends an email OTP via the backend. Does NOT create auth.users —
 * the account is created only after verifyEmailSignupOtp succeeds.
 */
export async function sendEmailSignupOtp(email: string, password: string) {
  const normalized = normalizeEmail(email);

  try {
    const response = await fetch(`${config.apiUrl}/api/auth/email-otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized, password }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };

    if (!response.ok) {
      return {
        status: 'error' as const,
        user: null,
        error: new Error(
          payload.error ||
            (response.status === 409
              ? 'Account already exists. Please log in instead.'
              : 'Could not send verification email.'),
        ),
      };
    }

    return { status: 'otp_sent' as const, user: null, error: null };
  } catch (error) {
    return {
      status: 'error' as const,
      user: null,
      error:
        error instanceof Error
          ? error
          : new Error('Could not send verification email.'),
    };
  }
}

export async function resendEmailSignupOtp(email: string, password: string) {
  return sendEmailSignupOtp(email, password);
}

/**
 * Verifies the emailed OTP, creates the auth user, and sets the local session.
 */
export async function verifyEmailSignupOtp(email: string, token: string) {
  const normalized = normalizeEmail(email);
  const cleaned = token.replace(/\D/g, '');

  if (cleaned.length < 6) {
    return { user: null, error: new Error('Enter the code from your email.') };
  }

  try {
    const response = await fetch(`${config.apiUrl}/api/auth/email-otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized, code: cleaned }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      access_token?: string;
      refresh_token?: string;
    };

    if (!response.ok) {
      return {
        user: null,
        error: new Error(payload.error || 'Wrong or expired code. Try again.'),
      };
    }

    if (!payload.access_token || !payload.refresh_token) {
      return {
        user: null,
        error: new Error('Could not start your session.'),
      };
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    });

    if (error || !data.user) {
      return {
        user: null,
        error: error ?? new Error('Could not start your session.'),
      };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return {
      user: null,
      error:
        error instanceof Error ? error : new Error('Verification failed.'),
    };
  }
}

export async function signUpWithPhone(phoneDigits: string, password: string) {
  return supabase.auth.signUp({
    phone: formatNepalPhone(phoneDigits),
    password,
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
}

export async function signInWithPhone(phoneDigits: string, password: string) {
  return supabase.auth.signInWithPassword({
    phone: formatNepalPhone(phoneDigits),
    password,
  });
}

export async function setAuthPassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export async function navigateAfterPasswordSignIn(
  router: { replace: (href: Href) => void },
  setAuthRole: (role: UserRole | null) => void,
  userId: string,
) {
  const profile = await fetchProfileByUserId(userId);

  if (!profile) {
    return { ok: false as const, error: 'No account profile found. Please finish signup.' };
  }

  const accepted = await hasAcceptedTerms(userId);
  if (!accepted) {
    router.replace('/(auth)/accept-terms');
    return { ok: true as const };
  }

  const profileRole = profile.role ?? 'customer';
  setAuthRole(profileRole);
  router.replace(await resolveAuthenticatedRoute(userId, profileRole));
  return { ok: true as const };
}

export async function upsertProfile(
  userId: string,
  phoneDigits: string,
  role: UserRole,
  fullName?: string | null,
) {
  return supabase.from('profiles').upsert({
    id: userId,
    phone: formatNepalPhone(phoneDigits),
    role,
    full_name: fullName?.trim() || null,
  });
}

export async function hasPartnerProfile(userId: string) {
  const { data, error } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
