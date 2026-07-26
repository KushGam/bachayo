export const APP_NAME = 'LastBag';

export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  /** Marketing / admin Next.js site — support contact API lives here. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://lastbag.app',
  esewaMerchantCode: process.env.EXPO_PUBLIC_ESEWA_MERCHANT_CODE ?? 'EPAYTEST',
  khaltiPublicKey: process.env.EXPO_PUBLIC_KHALTI_PUBLIC_KEY ?? '',
} as const;