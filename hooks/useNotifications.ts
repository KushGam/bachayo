import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { getRouteFromNotificationData, setupPushNotifications, type NotificationData } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

export function useNotificationObserver() {
  const router = useRouter();
  const lastHandledId = useRef<string | null>(null);

  useEffect(() => {
    if (isExpoGo()) {
      return;
    }

    const handleResponse = (response: Notifications.NotificationResponse) => {
      // getLastNotificationResponseAsync replays the tap that cold-started the
      // app, and the listener fires for that same tap — without this guard the
      // user gets navigated twice and lands on a duplicated back stack.
      const id = response.notification.request.identifier;
      if (lastHandledId.current === id) return;
      lastHandledId.current = id;

      const data = response.notification.request.content.data as NotificationData;
      const route = getRouteFromNotificationData(data);
      if (route) {
        router.push(route);
      }
    };

    // Foreground: auto-open review when pickup / rate push arrives (no tap needed).
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as NotificationData;
      const type = data?.type;
      const orderId = data?.orderId ?? data?.order_id;
      if (
        typeof orderId === 'string' &&
        orderId &&
        (type === 'review_request' || type === 'review' || type === 'pickup_confirmed')
      ) {
        router.push(`/(tabs)/customer/my-bags?review=${orderId}`);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleResponse(response);
      }
    });

    return () => {
      subscription.remove();
      receivedSub.remove();
    };
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
