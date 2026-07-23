import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Alert } from 'react-native';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInNativeResult =
  | { success: true; user: User }
  | { success: false; expoGo: true }
  | { success: false; cancelled: true }
  | { success: false; cancelled?: false; expoGo?: false; error?: unknown };

/**
 * Google OAuth via Supabase + expo-web-browser.
 * Works in EAS / production builds. Blocked in Expo Go with an alert.
 */
export async function signInWithGoogle(): Promise<GoogleSignInNativeResult> {
  const isExpoGo = Constants.appOwnership === 'expo';

  if (isExpoGo) {
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In is not available in Expo Go. Please use email or phone to sign in. Google Sign-In will work in the full LastBag app.',
      [{ text: 'OK', style: 'default' }],
    );
    return { success: false, expoGo: true };
  }

  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'lastbag',
      path: 'auth/callback',
    });

    console.log('[Google] redirectUri:', redirectUri);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        scopes: 'openid email profile',
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error || !data?.url) {
      console.error('[Google] OAuth error:', error);
      return { success: false, error: error ?? new Error('No OAuth URL') };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri, {
      showInRecents: true,
      preferEphemeralSession: false,
    });

    console.log('[Google] Browser result:', result.type);

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
        console.error('[Google] Session error:', sessionError);
        return { success: false, error: sessionError ?? new Error('No user in session') };
      }

      return { success: true, user: sessionData.user };
    }

    const code = queryParams.get('code') || hashParams.get('code');
    if (code) {
      const { data: exchangeData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !exchangeData.user) {
        console.error('[Google] Code exchange error:', exchangeError);
        return { success: false, error: exchangeError ?? new Error('No user after exchange') };
      }

      return { success: true, user: exchangeData.user };
    }

    return { success: false, error: new Error('No tokens in callback URL') };
  } catch (err) {
    console.error('[Google] Unexpected error:', err);
    return { success: false, error: err };
  }
}
