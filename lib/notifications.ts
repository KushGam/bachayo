import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Palette } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

let notificationHandlerReady = false;

function ensureNotificationHandler() {
  if (notificationHandlerReady) return;
  notificationHandlerReady = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function getEasProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    null
  );
}

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

let missingProjectIdLogged = false;

/**
 * Android groups notifications by channel and lets users mute each one
 * independently, so a customer can silence "new bags" marketing without losing
 * the pickup reminder for a bag they already paid for.
 *
 * Importance is fixed at creation time — Android ignores changes to an existing
 * channel, so renaming a channel id is the only way to alter these later.
 */
export async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('orders', {
    name: 'Orders & Reservations',
    description: 'New reservations and order updates',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: Palette.primary,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('bags', {
    name: 'New Rescue Bags',
    description: 'New bags from restaurants near you',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    lightColor: Palette.primary,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Pickup Reminders',
    description: 'Reminders to pick up your bag',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    lightColor: Palette.primary,
  });

  await Notifications.setNotificationChannelAsync('system', {
    name: 'Account & Subscription',
    description: 'Account updates and subscription alerts',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: Palette.primary,
  });
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  // Push tokens are not available in Expo Go (SDK 53+). Use a dev build for real push testing.
  if (isExpoGo()) {
    return null;
  }

  const projectId = getEasProjectId();
  if (!projectId) {
    if (__DEV__ && !missingProjectIdLogged) {
      missingProjectIdLogged = true;
      console.warn(
        '[notifications] Push disabled: set EXPO_PUBLIC_EAS_PROJECT_ID in .env.local after running `npx eas init`.',
      );
    }
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data;
  } catch (error) {
    if (__DEV__) {
      console.warn('[notifications] Failed to get push token:', error);
    }
    return null;
  }
}

export async function savePushToken(pushToken: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return;

  const { error } = await supabase
    .from('profiles')
    .update({ push_token: pushToken })
    .eq('id', userId);

  if (error) {
    console.error('[Push] Failed to save token:', error.message);
  }
}

export async function clearPushToken(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: null })
    .eq('id', userId);

  if (error) {
    console.error('[Push] Failed to clear token:', error.message);
  }
}

/**
 * Detach this device's push token from the signed-in account.
 * Must run before supabase.auth.signOut() — afterwards RLS blocks the update
 * and the next person to use this device keeps receiving the old user's pushes.
 */
export async function clearPushTokenForCurrentUser(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await clearPushToken(user.id);
    }
  } catch (err) {
    console.error('[Push] Failed to clear token:', err);
  }
}

export async function setupPushNotifications() {
  ensureNotificationHandler();
  await ensureAndroidChannels();
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await savePushToken(token);
  }
  return token;
}

export type NotificationData = {
  type?: string;
  orderId?: string;
  order_id?: string;
  bagId?: string;
  bag_id?: string;
  partner_id?: string;
  review_id?: string;
  [key: string]: unknown;
};

export type AndroidChannelId = 'orders' | 'bags' | 'reminders' | 'system';

/**
 * Kept in sync with backend/lib/notification-channels.ts, which stamps the
 * channel onto outgoing pushes. Unlisted types fall back to `system`.
 */
export const ANDROID_CHANNEL_BY_TYPE: Record<string, AndroidChannelId> = {
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
  system: 'system',
};

export function getAndroidChannelId(type: string | undefined): AndroidChannelId {
  return (type && ANDROID_CHANNEL_BY_TYPE[type]) || 'system';
}

export function getRouteFromNotificationData(data: NotificationData) {
  const orderId = data.orderId ?? data.order_id;
  const bagId = data.bagId ?? data.bag_id;
  const type = data.type;

  if (type === 'reservation' && bagId) {
    return `/bag/${bagId}` as const;
  }
  if (type === 'new_bag' && bagId) {
    return `/bag/${bagId}` as const;
  }
  if (type === 'pickup_confirmed' && orderId) {
    return '/(tabs)/customer/my-bags' as const;
  }
  if (type === 'cancellation' || type === 'bag_cancelled') {
    return '/(tabs)/customer/my-bags' as const;
  }
  if ((type === 'pickup_reminder' || type === 'order') && orderId) {
    return `/order/${orderId}` as const;
  }
  if ((type === 'review_request' || type === 'review') && orderId) {
    return `/review/${orderId}` as const;
  }
  if (type === 'order_message' && orderId) {
    return `/order/chat/${orderId}` as const;
  }
  if (type === 'review_reply') {
    if (typeof data.partner_id === 'string' && data.partner_id) {
      return `/partner/${data.partner_id}` as const;
    }
    return '/(tabs)/customer/my-bags' as const;
  }
  if (type === 'bag_expiring') {
    return '/(tabs)/partner/my-bags' as const;
  }
  if (type === 'subscription') {
    return '/(tabs)/partner/subscription' as const;
  }
  if (type === 'partner_dashboard') {
    return '/(tabs)/partner/dashboard' as const;
  }
  if (type === 'bag' && bagId) {
    return `/bag/${bagId}` as const;
  }
  // Anything without a dedicated screen (announcements, generic system notices)
  // still needs somewhere to land — a tap that does nothing reads as a bug.
  if (type) {
    return '/notifications' as const;
  }
  return null;
}
