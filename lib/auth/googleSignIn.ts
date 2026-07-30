import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInNativeResult =
  | { success: true; user: any }
  | { success: false; expoGo: true }
  | { success: false; cancelled: true }
  | { success: false; cancelled?: false; expoGo?: false; error?: unknown };

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

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri, {
      showInRecents: true,
      preferEphemeralSession: false,
    });

    if (result.type !== 'success') {
      return {
        success: false,
        cancelled: result.type === 'cancel' || result.type === 'dismiss',
      };
    }

    const url = result.url;
    const hashParams = new URLSearchParams(url.split('#')[1] || '');
    const queryString = url.split('?')[1]?.split('#')[0] || '';
    const queryParams = new URLSearchParams(queryString);

    const accessToken =
      hashParams.get('access_token') || queryParams.get('access_token');
    const refreshToken =
      hashParams.get('refresh_token') || queryParams.get('refresh_token');

    if (accessToken) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError || !sessionData.user) {
        return {
          success: false,
          error: sessionError,
        };
      }

      return {
        success: true,
        user: sessionData.user,
      };
    }

    const code = queryParams.get('code') || hashParams.get('code');

    if (code) {
      const { data: exchangeData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !exchangeData.user) {
        return {
          success: false,
          error: exchangeError,
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
    return { success: false, error: err };
  }
}
