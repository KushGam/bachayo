export type AndroidChannelId = 'orders' | 'bags' | 'reminders' | 'system';

/**
 * Android drops a push into the channel named here, and the channel decides
 * whether it makes a sound or is silently muted. The ids must match the
 * channels the app creates in lib/notifications.ts — an unknown id on Android 8+
 * means the notification is never shown at all.
 */
const CHANNEL_BY_TYPE: Record<string, AndroidChannelId> = {
  reservation: 'orders',
  bag_cancelled: 'orders',
  cancellation: 'orders',
  order_message: 'orders',
  pickup_confirmed: 'orders',
  new_bag: 'bags',
  bag_expiring: 'bags',
  pickup_reminder: 'reminders',
  subscription: 'system',
  review_request: 'system',
  review_reply: 'system',
  new_review: 'system',
  system: 'system',
};

export function getAndroidChannelId(type: string | undefined): AndroidChannelId {
  return (type && CHANNEL_BY_TYPE[type]) || 'system';
}
