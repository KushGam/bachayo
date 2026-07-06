import { supabase } from '@/lib/supabase';
import type { Partner } from '@/types/database';

export async function fetchCurrentPartner(): Promise<Partner | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
