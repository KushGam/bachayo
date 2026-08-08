import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

import { config } from '@/constants/config';
import { isExpoGo } from '@/lib/expoGo';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/** Deep link used by the browser OAuth fallback (binaries without RNGoogleSignin). */
const NATIVE_OAUTH_REDIRECT = 'lastbag://auth/callback';

export type GoogleSignInNativeResult =
  | { success: true; user: any }
  | { success: false; expoGo: true }
  | { success: false; cancelled: true }
  | { success: false; cancelled?: false; expoGo?: false; error?: unknown };

type GoogleNativeModule = typeof import('@react-native-google-signin/google-signin');

let nativeModule: GoogleNativeModule | null | undefined;
let nativeConfigured = false;

/**
 * Lazy-load the native module. A static import crashes any binary that was
 * built before `@react-native-google-signin/google-signin` was linked
 * (Expo Go, older TestFlight / EAS builds).
 */
function tryLoadNativeGoogleSignIn(): GoogleNativeModule | null {
  if (nativeModule !== undefined) return nativeModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeModule = require('@react-native-google-signin/google-signin') as GoogleNativeModule;
    return nativeModule;
  } catch (err) {
    console.warn('[Google] Native module unavailable:', err);
    nativeModule = null;
    return null;
  }
}

function ensureNativeConfigured(mod: GoogleNativeModule) {
  if (nativeConfigured) return;
  const webClientId = config.googleWebClientId;
  if (!webClientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_CLIENT_ID (Google Cloud Web client ID). Required for native Google Sign-In.',
    );
  }
  // Android: never pass androidClientId — the library rejects it and Google
  // matches the app via package name + SHA-1 on the Android OAuth client.
  mod.GoogleSignin.configure({
    webClientId,
    iosClientId: Platform.OS === 'ios' ? config.googleIosClientId || undefined : undefined,
    offlineAccess: false,
    scopes: ['openid', 'email', 'profile'],
  });
  nativeConfigured = true;
}

function isNativeModuleMissingError(message: string) {
  return (
    message.includes('RNGoogleSignin') ||
    message.includes('TurboModuleRegistry') ||
    message.includes('Native module')
  );
}

/** Google Cloud / SHA-1 / package mismatch — common on Android EAS / Play builds. */
function isDeveloperConfigError(err: unknown) {
  const code =
    typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code) : '';
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err && 'message' in err
        ? String((err as { message?: unknown }).message)
        : String(err ?? '');
  const blob = `${code} ${message}`.toLowerCase();
  return (
    code === '10' ||
    blob.includes('developer_error') ||
    blob.includes('developer console is not set up correctly') ||
    blob.includes('api_exception: 10')
  );
}

async function exchangeIdToken(idToken: string): Promise<GoogleSignInNativeResult> {
  if (__DEV__) console.log('[Google] Exchanging ID token with Supabase');
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) {
    console.error('[Google] signInWithIdToken failed:', error.message);
    return { success: false, error };
  }
  if (!data.user) {
    return { success: false, error: new Error('No user returned from Google sign-in') };
  }
  return { success: true, user: data.user };
}

async function signInWithNativeGoogle(
  mod: GoogleNativeModule,
): Promise<GoogleSignInNativeResult> {
  ensureNativeConfigured(mod);

  if (Platform.OS === 'android') {
    await mod.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await mod.GoogleSignin.signIn();
  if (!mod.isSuccessResponse(response)) {
    return { success: false, cancelled: true };
  }

  let idToken = response.data.idToken;
  if (!idToken) {
    const tokens = await mod.GoogleSignin.getTokens();
    idToken = tokens.idToken;
  }
  if (!idToken) {
    return { success: false, error: new Error('Google did not return an ID token') };
  }
  return exchangeIdToken(idToken);
}

function getOAuthRedirectUri(): string {
  if (Constants.appOwnership !== 'expo') {
    return NATIVE_OAUTH_REDIRECT;
  }
  return AuthSession.makeRedirectUri({
    scheme: 'lastbag',
    path: 'auth/callback',
  });
}

function parseCallbackParams(url: string) {
  const hashParams = new URLSearchParams(url.split('#')[1] || '');
  const queryString = url.split('?')[1]?.split('#')[0] || '';
  const queryParams = new URLSearchParams(queryString);
  return {
    accessToken: hashParams.get('access_token') || queryParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token') || queryParams.get('refresh_token'),
    code: queryParams.get('code') || hashParams.get('code'),
    error: queryParams.get('error') || hashParams.get('error'),
    errorDescription:
      queryParams.get('error_description') || hashParams.get('error_description'),
  };
}

async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

/** Browser / ASWebAuthenticationSession fallback when native SDK is not linked. */
async function signInWithBrowserOAuth(): Promise<GoogleSignInNativeResult> {
  const redirectUri = getOAuthRedirectUri();
  if (__DEV__) console.log('[Google] Browser OAuth fallback, redirectUri:', redirectUri);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      scopes: 'openid email profile',
      skipBrowserRedirect: true,
      queryParams: {
        // Prefer account picker every time on Android Custom Tabs.
        prompt: 'select_account',
      },
    },
  });

  if (error || !data?.url) {
    return { success: false, error: error ?? new Error('No OAuth URL') };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri, {
    showInRecents: false,
    preferEphemeralSession: false,
    createTask: false,
  });

  const existingUser = await getSessionUser();
  if (existingUser) return { success: true, user: existingUser };

  if (result.type !== 'success') {
    return {
      success: false,
      cancelled: result.type === 'cancel' || result.type === 'dismiss',
    };
  }

  const params = parseCallbackParams(result.url);
  if (params.error) {
    return { success: false, error: new Error(params.errorDescription || params.error) };
  }

  if (params.accessToken) {
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken || '',
    });
    if (!sessionError && sessionData.user) {
      return { success: true, user: sessionData.user };
    }
  }

  if (params.code) {
    const { data: exchangeData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(params.code);
    if (!exchangeError && exchangeData.user) {
      return { success: true, user: exchangeData.user };
    }
    const recovered = await getSessionUser();
    if (recovered) return { success: true, user: recovered };
    return {
      success: false,
      error: exchangeError ?? new Error('Could not exchange auth code'),
    };
  }

  return { success: false, error: new Error('No tokens in callback') };
}

/**
 * Prefer native Google Sign-In (new EAS builds). Fall back to browser OAuth
 * when RNGoogleSignin is missing, or Android hits DEVELOPER_ERROR (SHA-1 /
 * package mismatch) so the button still works until Google Cloud is fixed.
 */
export async function signInWithGoogle(): Promise<GoogleSignInNativeResult> {
  if (isExpoGo()) {
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In needs a development or store build (not Expo Go). Please use email or phone, or install the TestFlight / Play build.',
      [{ text: 'OK', style: 'default' }],
    );
    return { success: false, expoGo: true };
  }

  const native = tryLoadNativeGoogleSignIn();

  try {
    if (native) {
      if (__DEV__) console.log('[Google] Using native Google Sign-In');
      return await signInWithNativeGoogle(native);
    }

    console.warn('[Google] RNGoogleSignin not in this binary — using browser OAuth');
    return await signInWithBrowserOAuth();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (isNativeModuleMissingError(message)) {
      console.warn('[Google] Native call failed, falling back to browser OAuth:', message);
      try {
        return await signInWithBrowserOAuth();
      } catch (fallbackErr) {
        return { success: false, error: fallbackErr };
      }
    }

    // Android SHA-1 / package mismatch — still let the user sign in via browser.
    if (Platform.OS === 'android' && isDeveloperConfigError(err)) {
      console.warn(
        '[Google] Native Android DEVELOPER_ERROR (check package com.lastbag.app SHA-1 in Google Cloud). Falling back to browser OAuth.',
      );
      try {
        return await signInWithBrowserOAuth();
      } catch (fallbackErr) {
        return {
          success: false,
          error: new Error(
            'Google sign-in isn’t configured for this Android build. Ask support to add the app SHA-1 in Google Cloud, or try phone/email.',
          ),
        };
      }
    }

    if (native?.isErrorWithCode(err)) {
      if (err.code === native.statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, cancelled: true };
      }
      if (err.code === native.statusCodes.IN_PROGRESS) {
        return { success: false, cancelled: true };
      }
      if (err.code === native.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: new Error('Google Play Services is not available on this device'),
        };
      }
    }

    console.error('[Google] Sign-in error:', err);
    const recovered = await getSessionUser();
    if (recovered) return { success: true, user: recovered };
    return { success: false, error: err };
  }
}
