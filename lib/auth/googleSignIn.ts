import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/** Must match Supabase Auth → URL Configuration → Redirect URLs exactly. */
const NATIVE_OAUTH_REDIRECT = 'lastbag://auth/callback';

export type GoogleSignInNativeResult =
  | { success: true; user: any }
  | { success: false; expoGo: true }
  | { success: false; cancelled: true }
  | { success: false; cancelled?: false; expoGo?: false; error?: unknown };

function getOAuthRedirectUri(): string {
  // Store / dev-client builds always use the custom scheme. makeRedirectUri
  // can produce proxy/exp URLs that Supabase rejects → falls back to Site URL
  // (https://lastbag.app), which is what users see in the in-app browser.
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

export async function signInWithGoogle(): Promise<GoogleSignInNativeResult> {
  const isExpoGo = Constants.appOwnership === 'expo';

  if (isExpoGo) {
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In is not available in Expo Go. Please use email or phone.',
      [{ text: 'OK', style: 'default' }],
    );
    return { success: false, expoGo: true };
  }

  try {
    const redirectUri = getOAuthRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        scopes: 'openid email profile',
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      return {
        success: false,
        error: error ?? new Error('No OAuth URL'),
      };
    }

    // If Supabase rejected our deep link, authorize URL already points at the website.
    const redirectInUrl = (() => {
      try {
        return new URL(data.url).searchParams.get('redirect_to') ?? '';
      } catch {
        return '';
      }
    })();
    if (
      redirectInUrl.startsWith('http') &&
      !redirectInUrl.startsWith(NATIVE_OAUTH_REDIRECT)
    ) {
      console.error(
        '[Google] Supabase rewrote redirect_to to',
        redirectInUrl,
        '— add',
        NATIVE_OAUTH_REDIRECT,
        'in Auth URL Configuration',
      );
      Alert.alert(
        'Couldn’t sign in with Google',
        'Google sign-in isn’t ready yet. Please try phone or email instead.',
      );
      return {
        success: false,
        error: new Error(`Supabase rewrote redirect_to to ${redirectInUrl}`),
      };
    }

    // Keeps the flow inside the app: ASWebAuthenticationSession on iOS,
    // Chrome Custom Tabs on Android — never a hand-off to Safari/Chrome.
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri, {
      showInRecents: false,
      preferEphemeralSession: false,
      createTask: false,
    });

    // Deep link handler (app/auth/callback) may have already exchanged the code
    // and established a session while the auth sheet was closing.
    const existingUser = await getSessionUser();
    if (existingUser) {
      return { success: true, user: existingUser };
    }

    if (result.type !== 'success') {
      return {
        success: false,
        cancelled: result.type === 'cancel' || result.type === 'dismiss',
      };
    }

    const url = result.url;
    const params = parseCallbackParams(url);

    if (params.error) {
      return {
        success: false,
        error: new Error(params.errorDescription || params.error),
      };
    }

    // Supabase ignored redirectTo and sent users to the website Site URL.
    if (/^https?:\/\//i.test(url) && !params.accessToken && !params.code) {
      console.error('[Google] OAuth landed on website:', url);
      Alert.alert(
        'Couldn’t sign in with Google',
        'Google sign-in isn’t ready yet. Please try phone or email instead.',
      );
      return {
        success: false,
        error: new Error(`OAuth landed on website: ${url}`),
      };
    }

    if (params.accessToken) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: params.accessToken,
        refresh_token: params.refreshToken || '',
      });

      if (sessionError || !sessionData.user) {
        const recovered = await getSessionUser();
        if (recovered) return { success: true, user: recovered };
        return {
          success: false,
          error: sessionError ?? new Error('Could not set session'),
        };
      }

      return {
        success: true,
        user: sessionData.user,
      };
    }

    if (params.code) {
      const { data: exchangeData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(params.code);

      if (exchangeError || !exchangeData.user) {
        // Code may already have been consumed by app/auth/callback.tsx.
        const recovered = await getSessionUser();
        if (recovered) return { success: true, user: recovered };
        return {
          success: false,
          error: exchangeError ?? new Error('Could not exchange auth code'),
        };
      }

      return {
        success: true,
        user: exchangeData.user,
      };
    }

    return {
      success: false,
      error: new Error('No tokens in callback'),
    };
  } catch (err) {
    console.error('[Google] Error:', err);
    const recovered = await getSessionUser();
    if (recovered) return { success: true, user: recovered };
    return { success: false, error: err };
  }
}
