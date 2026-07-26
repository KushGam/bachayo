import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

GoogleSignin.configure({
  webClientId: '15006662352-h97ftr7kvuisj52lc8u49qgrk7928euu.apps.googleusercontent.com',
  iosClientId: '15006662352-kt4cm0fcnsq1q3lithmps5rl68hhclpu.apps.googleusercontent.com',
  scopes: ['email', 'profile'],
  offlineAccess: true,
});

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
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;

    if (!idToken) {
      return {
        success: false,
        error: new Error('No ID token received'),
      };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      console.error('[Google] Supabase error:', error);
      return { success: false, error };
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, cancelled: true };
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return {
        success: false,
        error: new Error('Already signing in'),
      };
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('Google Play Services required', 'Please update Google Play Services.');
      return {
        success: false,
        error: new Error('Play Services unavailable'),
      };
    }
    console.error('[Google] Error:', error);
    return { success: false, error };
  }
}
