import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Alert, Platform } from 'react-native';

import { config } from '@/constants/config';
import { isExpoGo } from '@/lib/expoGo';
import { supabase } from '@/lib/supabase';

export type GoogleSignInNativeResult =
  | { success: true; user: any }
  | { success: false; expoGo: true }
  | { success: false; cancelled: true }
  | { success: false; cancelled?: false; expoGo?: false; error?: unknown };

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const webClientId = config.googleWebClientId;
  if (!webClientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_CLIENT_ID (Google Cloud Web client ID). Required for native Google Sign-In.',
    );
  }

  GoogleSignin.configure({
    webClientId,
    iosClientId: config.googleIosClientId || undefined,
    offlineAccess: false,
    scopes: ['openid', 'email', 'profile'],
  });
  configured = true;
}

/**
 * Native Google Sign-In → Supabase session via ID token.
 *
 * Uses Google's system UI (no supabase.co in the iOS / Google prompts) and
 * avoids the brittle browser PKCE redirect that was failing in EAS builds.
 */
export async function signInWithGoogle(): Promise<GoogleSignInNativeResult> {
  if (isExpoGo()) {
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In is not available in Expo Go. Please use a development or store build, or sign in with email or phone.',
      [{ text: 'OK', style: 'default' }],
    );
    return { success: false, expoGo: true };
  }

  try {
    ensureConfigured();

    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { success: false, cancelled: true };
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      // Some Android configs return tokens only via getTokens().
      const tokens = await GoogleSignin.getTokens();
      if (!tokens.idToken) {
        return {
          success: false,
          error: new Error('Google did not return an ID token'),
        };
      }
      return exchangeIdToken(tokens.idToken);
    }

    return exchangeIdToken(idToken);
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, cancelled: true };
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        return { success: false, cancelled: true };
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: new Error('Google Play Services is not available on this device'),
        };
      }
    }

    console.error('[Google] Native sign-in error:', err);
    return { success: false, error: err };
  }
}

async function exchangeIdToken(idToken: string): Promise<GoogleSignInNativeResult> {
  console.log('[Google] Exchanging ID token with Supabase');

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
