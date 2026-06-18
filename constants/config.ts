export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  esewaMerchantCode: process.env.EXPO_PUBLIC_ESEWA_MERCHANT_CODE ?? 'EPAYTEST',
  khaltiPublicKey: process.env.EXPO_PUBLIC_KHALTI_PUBLIC_KEY ?? '',
} as const;