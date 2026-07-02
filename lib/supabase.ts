import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (__DEV__) {
  console.log('[supabase] EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl || '(missing)');
  console.log(
    '[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY:',
    supabaseAnonKey ? `${supabaseAnonKey.slice(0, 8)}…` : '(missing)',
  );
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
