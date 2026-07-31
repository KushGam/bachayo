import { config } from '@/constants/config';
import { supabase } from '@/lib/supabase';

export type SendNotificationInput = {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
};

/**
 * Replaces the `send-notification` Supabase Edge Function. The Next.js route
 * authenticates the caller with their Supabase access token, so no shared
 * secret ever ships in the app bundle.
 *
 * Notifications are best-effort: a failure here must never roll back the action
 * that triggered it (a sent chat message, a confirmed pickup).
 */
export async function sendNotification(input: SendNotificationInput): Promise<boolean> {
  const baseUrl = config.apiUrl?.replace(/\/$/, '');
  if (!baseUrl) {
    if (__DEV__) {
      console.warn('[notifications] EXPO_PUBLIC_API_URL not set — skipping push');
    }
    return false;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return false;

    const response = await fetch(`${baseUrl}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        user_id: input.userId,
        title: input.title,
        body: input.body,
        type: input.type,
        data: input.data,
      }),
    });

    if (!response.ok) {
      if (__DEV__) {
        console.warn('[notifications] send failed:', response.status, await response.text());
      }
      return false;
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('[notifications] send failed:', error);
    }
    return false;
  }
}
