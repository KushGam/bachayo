import axios from 'axios';

import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { sendExpoPush } from '@/lib/expo-push';

export async function deliverNotification(userId: string, title: string, body: string) {
  const supabase = createSupabaseAdmin();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile?.push_token) {
    return { success: false, error: 'no_push_token' };
  }

  await sendExpoPush([
    {
      to: profile.push_token,
      title,
      body,
      sound: 'default',
    },
  ]);

  return { success: true };
}

export function verifyInternalSecret(headerValue: string | null) {
  const expected = process.env.INTERNAL_SECRET;
  if (!expected) {
    throw new Error('INTERNAL_SECRET is not configured');
  }
  if (headerValue !== expected) {
    throw new Error('Unauthorized');
  }
}

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

export async function callSendNotification(userId: string, title: string, body: string) {
  const baseUrl = getBaseUrl();
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    throw new Error('INTERNAL_SECRET is not configured');
  }

  const { data } = await axios.post(
    `${baseUrl}/api/send-notification`,
    { user_id: userId, title, body },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
    },
  );

  return data as { success: boolean; error?: string };
}
