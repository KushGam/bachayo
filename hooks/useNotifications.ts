import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { getRouteFromNotificationData, setupPushNotifications, type NotificationData } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

export function useNotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    if (isExpoGo()) {
      return;
    }

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData;
      const route = getRouteFromNotificationData(data);
      if (route) {
        router.push(route);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleResponse(response);
      }
    });

    return () => subscription.remove();
  }, [router]);
}

export function usePushTokenRegistration() {
  useEffect(() => {
    if (isExpoGo()) {
      return;
    }

    void setupPushNotifications();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        void setupPushNotifications();
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);
}
