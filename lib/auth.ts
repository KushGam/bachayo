import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

export function formatNepalPhone(digits: string) {
  return `+977${digits}`;
}

export async function sendPhoneOtp(phoneDigits: string) {
  return supabase.auth.signInWithOtp({
    phone: formatNepalPhone(phoneDigits),
  });
}

export async function verifyPhoneOtp(phoneDigits: string, token: string) {
  return supabase.auth.verifyOtp({
    phone: formatNepalPhone(phoneDigits),
    token,
    type: 'sms',
  });
}

export async function upsertProfile(userId: string, phoneDigits: string, role: UserRole) {
  return supabase.from('profiles').upsert({
    id: userId,
    phone: formatNepalPhone(phoneDigits),
    role,
  });
}

export async function hasPartnerProfile(userId: string) {
  const { data, error } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
