import { supabase } from '@/lib/supabase';

export async function uploadPartnerCover(userId: string, uri: string) {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('partner-covers').upload(path, arrayBuffer, {
    contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('partner-covers').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadBagImage(partnerId: string, uri: string) {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const path = `${partnerId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('rescue-bags').upload(path, arrayBuffer, {
    contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('rescue-bags').getPublicUrl(path);
  return data.publicUrl;
}
