import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/** HTTPS callback so iOS shows "lastbag.app" instead of the Supabase project host. */
const OAUTH_REDIRECT_TO = 'https://lastbag.app/auth/callback';

export type GoogleSignInNativeResult =
  | { success: true; user: any }
  | { success: false; expoGo: true }
  | { success: false; cancelled: true }
  | { success: false; cancelled?: false; expoGo?: false; error?: unknown };

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
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'lastbag',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: OAUTH_REDIRECT_TO,
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

    // Keeps the flow inside the app: ASWebAuthenticationSession on iOS,
    // Chrome Custom Tabs on Android — never a hand-off to Safari/Chrome.
    // Pass the HTTPS callback so iOS shows "lastbag.app" (not supabase.co).
    console.log('[Google] redirectUri:', redirectUri, 'redirectTo:', OAUTH_REDIRECT_TO);
    const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT_TO, {
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
    console.log('[Google] Callback URL:', url);

    // Parse all params
    const hashParams = new URLSearchParams(url.split('#')[1] || '');
    const queryString = url.split('?')[1]?.split('#')[0] || '';
    const queryParams = new URLSearchParams(queryString);

    const code = queryParams.get('code') || hashParams.get('code');

    const accessToken =
      hashParams.get('access_token') || queryParams.get('access_token');

    const refreshToken =
      hashParams.get('refresh_token') || queryParams.get('refresh_token');

    const oauthError = queryParams.get('error') || hashParams.get('error');
    const oauthErrorDescription =
      queryParams.get('error_description') || hashParams.get('error_description');

    if (oauthError) {
      return {
        success: false,
        error: new Error(oauthErrorDescription || oauthError),
      };
    }

    // Try access token first
    if (accessToken) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      if (!sessionError && sessionData.user) {
        return { success: true, user: sessionData.user };
      }
      const recovered = await getSessionUser();
      if (recovered) return { success: true, user: recovered };
    }

    // Try code exchange
    if (code) {
      const { data: exchangeData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError && exchangeData.user) {
        return { success: true, user: exchangeData.user };
      }
      console.error('[Google] Code exchange failed:', exchangeError);
      // Code may already have been consumed by app/auth/callback.tsx.
      const recovered = await getSessionUser();
      if (recovered) return { success: true, user: recovered };
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
