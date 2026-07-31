import { sendExpoPush } from '@/lib/expo-push';
import { getAndroidChannelId } from '@/lib/notification-channels';
import { shouldSendNotification } from '@/lib/notification-prefs';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export type DeliverNotificationOptions = {
  type?: string;
  data?: Record<string, unknown>;
  /** Bypass the user's notification preferences. Use only for account-critical alerts. */
  force?: boolean;
};

export type DeliverNotificationResult = {
  success: boolean;
  error?: string;
  skipped?: boolean;
  reason?: string;
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
): Promise<DeliverNotificationResult> {
  const supabase = createSupabaseAdmin();
  const notificationType = options?.type ?? 'system';
  const notificationData = options?.data ?? null;
  const pushData = notificationData ?? { type: notificationType };

  if (!options?.force) {
    const allowed = await shouldSendNotification(userId, notificationType);
    if (!allowed) {
      return { success: true, skipped: true, reason: 'User preference' };
    }
  }

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
        channelId: getAndroidChannelId(notificationType),
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

/**
 * Kept as a thin alias so existing call sites read the same. It used to POST to
 * /api/send-notification over the network, which cost a round trip and needed
 * INTERNAL_SECRET set just to talk to ourselves.
 */
export async function callSendNotification(
  userId: string,
  title: string,
  body: string,
  options?: DeliverNotificationOptions,
): Promise<DeliverNotificationResult> {
  return deliverNotification(userId, title, body, options);
}

export async function sendNotificationPayload(
  userId: string,
  payload: { title: string; body: string; type: string; data: Record<string, unknown> },
  options?: { force?: boolean },
): Promise<DeliverNotificationResult> {
  return deliverNotification(userId, payload.title, payload.body, {
    type: payload.type,
    data: payload.data,
    force: options?.force,
  });
}
