import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { getRouteFromNotificationData, setupPushNotifications, type NotificationData } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

export function useNotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData;
      const route = getRouteFromNotificationData(data);
      if (route) {
        router.push(route);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleResponse(response);
      }
    });

    return () => subscription.remove();
  }, [router]);
}

export function usePushTokenRegistration() {
  useEffect(() => {
    setupPushNotifications();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setupPushNotifications();
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);
}
