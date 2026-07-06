import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import type { Href } from 'expo-router';

import { resolveAuthenticatedRoute } from '@/lib/navigation';

import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

WebBrowser.maybeCompleteAuthSession();

const googleRedirectUri = makeRedirectUri({
  scheme: 'lastbag',
  path: 'auth/callback',
});

export type GoogleSignInResult =
  | { status: 'cancelled' }
  | { status: 'success'; userId: string; hasProfile: boolean };

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  throw new Error('No auth credentials returned');
}

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
) {
  const result = await signInWithGoogle();

  if (result.status === 'cancelled') {
    return { ok: false as const, cancelled: true };
  }

  if (result.hasProfile) {
    const role = await fetchUserRole(result.userId);
    setAuthRole(role ?? 'customer');
    router.replace(await resolveAuthenticatedRoute(result.userId, role ?? 'customer'));
    return { ok: true as const, cancelled: false };
  }

  router.replace('/(auth)/complete-profile');
  return { ok: true as const, cancelled: false };
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: googleRedirectUri,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('Could not start Google sign-in');

  const result = await WebBrowser.openAuthSessionAsync(data.url, googleRedirectUri);

  if (result.type !== 'success') {
    return { status: 'cancelled' };
  }

  const session = await createSessionFromUrl(result.url);
  if (!session?.user) {
    throw new Error('Sign-in failed');
  }

  const hasProfile = await hasUserProfile(session.user.id);

  return {
    status: 'success',
    userId: session.user.id,
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

  const profileRole = profile.role ?? 'customer';
  setAuthRole(profileRole);
  router.replace(await resolveAuthenticatedRoute(userId, profileRole));
  return { ok: true as const };
}

export async function sendPhoneOtp(phoneDigits: string) {
  return supabase.auth.signInWithOtp({
    phone: formatNepalPhone(phoneDigits),
  });
}

export async function verifyPhoneOtp(phoneDigits: string, token: string) {
  return supabase.auth.verifyOtp({
    phone: formatNepalPhone(phoneDigits),
    token,
    type: 'sms',
  });
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
