export const APP_NAME = 'LastBag';

export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  /** Marketing / admin Next.js site — support contact API lives here. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://lastbag.app',
  esewaMerchantCode: process.env.EXPO_PUBLIC_ESEWA_MERCHANT_CODE ?? '',
  khaltiPublicKey: process.env.EXPO_PUBLIC_KHALTI_PUBLIC_KEY ?? '',
  /** Google Cloud → Credentials → OAuth 2.0 Web client ID (required for native idToken). */
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
  /** Google Cloud → Credentials → OAuth 2.0 iOS client ID */
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  /**
   * Android OAuth client ID — used only in Supabase “Client IDs” list (comma-separated).
   * Do NOT pass to GoogleSignin.configure(); Android matches via package + SHA-1.
   */
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
} as const;
