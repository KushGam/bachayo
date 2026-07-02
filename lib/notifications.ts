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

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: Palette.primary,
    });
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

  await supabase.from('profiles').update({ push_token: pushToken }).eq('id', userId);
}

export async function setupPushNotifications() {
  ensureNotificationHandler();
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
};

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
  if (type === 'cancellation') {
    return '/(tabs)/customer/my-bags' as const;
  }
  if ((type === 'pickup_reminder' || type === 'order') && orderId) {
    return `/order/${orderId}` as const;
  }
  if ((type === 'review_request' || type === 'review') && orderId) {
    return `/review/${orderId}` as const;
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
  return null;
}
