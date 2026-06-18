import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D9E75',
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

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return tokenResponse.data;
}

export async function savePushToken(pushToken: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return;

  await supabase.from('profiles').update({ push_token: pushToken }).eq('id', userId);
}

export async function setupPushNotifications() {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await savePushToken(token);
  }
  return token;
}

export type NotificationData = {
  type?: 'order' | 'partner_dashboard' | 'bag';
  orderId?: string;
  bagId?: string;
};

export function getRouteFromNotificationData(data: NotificationData) {
  if (data.type === 'order' && data.orderId) {
    return `/order/${data.orderId}` as const;
  }
  if (data.type === 'partner_dashboard') {
    return '/(tabs)/partner/dashboard' as const;
  }
  if (data.type === 'bag' && data.bagId) {
    return `/bag/${data.bagId}` as const;
  }
  return null;
}
