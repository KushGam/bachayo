import axios from 'axios';

import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { sendExpoPush } from '@/lib/expo-push';

export type DeliverNotificationOptions = {
  type?: string;
  data?: Record<string, unknown>;
};

async function saveInboxNotification(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  title: string,
  body: string,
  type: string,
  data: Record<string, unknown> | null,
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body,
    type,
    data,
  } as never);

  if (error) {
    console.warn('[notifications] inbox insert failed:', error.message);
  }
}

export async function deliverNotification(
  userId: string,
  title: string,
  body: string,
  options?: DeliverNotificationOptions,
) {
  const supabase = createSupabaseAdmin();
  const notificationType = options?.type ?? 'system';
  const notificationData = options?.data ?? null;
  const pushData = notificationData ?? { type: notificationType };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  let pushSent = false;
  if (profile?.push_token) {
    await sendExpoPush([
      {
        to: profile.push_token,
        title,
        body,
        sound: 'default',
        data: pushData,
      },
    ]);
    pushSent = true;
  }

  await saveInboxNotification(
    supabase,
    userId,
    title,
    body,
    notificationType,
    notificationData,
  );

  if (!pushSent) {
    return { success: true, error: 'no_push_token' };
  }

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

export async function callSendNotification(
  userId: string,
  title: string,
  body: string,
  options?: DeliverNotificationOptions,
) {
  const baseUrl = getBaseUrl();
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    throw new Error('INTERNAL_SECRET is not configured');
  }

  const { data: responseData } = await axios.post(
    `${baseUrl}/api/send-notification`,
    {
      user_id: userId,
      title,
      body,
      type: options?.type,
      data: options?.data,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
    },
  );

  return responseData as { success: boolean; error?: string };
}

export async function sendNotificationPayload(
  userId: string,
  payload: { title: string; body: string; type: string; data: Record<string, unknown> },
) {
  return callSendNotification(userId, payload.title, payload.body, {
    type: payload.type,
    data: payload.data,
  });
}
