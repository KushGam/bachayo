import { ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';
import { useColorScheme } from '@/components/useColorScheme';
import { useNotificationObserver, usePushTokenRegistration } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { initAnalytics } from '@/lib/analytics';
import { markIntentionalSignOut, wasIntentionalSignOut } from '@/lib/auth/signOutIntent';
import { clearPushTokenForCurrentUser } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import Colors, { Palette } from '@/constants/Colors';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  console.log('[boot] layout mounted');

  useEffect(() => {
    try {
      initAnalytics();
    } catch (error) {
      console.error('[boot] initAnalytics failed:', error);
    }
  }, []);

  useEffect(() => {
    void useLocationStore.getState().requestLocation();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <ScreenErrorBoundary>
            <RootLayoutNav />
          </ScreenErrorBoundary>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const segments = useSegments();
  const setAuthRole = useAuthStore((s) => s.setAuthRole);
  const hadSessionRef = useRef(false);

  usePushTokenRegistration();
  useNotificationObserver();
  useUnreadNotifications();
  useUnreadMessages();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;

      if (session?.user) {
        hadSessionRef.current = true;
        return;
      }

      if (event !== 'SIGNED_OUT') return;

      const intentional = wasIntentionalSignOut();
      const root = String(segments[0] ?? '');
      const onPublicAuth =
        root === '(auth)' ||
        root === '(landing)' ||
        root === 'index' ||
        root === 'loading' ||
        root === 'legal' ||
        root === 'auth' ||
        root === '';

      if (intentional || onPublicAuth || !hadSessionRef.current) {
        hadSessionRef.current = false;
        return;
      }

      hadSessionRef.current = false;
      setAuthRole(null);
      Alert.alert('Session expired', 'Please log in again.', [
        {
          text: 'Log in →',
          onPress: () => {
            markIntentionalSignOut();
            void clearPushTokenForCurrentUser().finally(() => {
              void supabase.auth.signOut().finally(() => {
                router.replace('/(auth)/welcome');
              });
            });
          },
        },
      ]);
    });

    return () => subscription.unsubscribe();
  }, [router, segments, setAuthRole]);

  const theme = {
    dark: colorScheme === 'dark',
    colors: {
      primary: Palette.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: Palette.borderSubtle,
      notification: Palette.amber,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '800' as const },
    },
  };

  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="loading" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(landing)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="bag/[id]"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="reserve/[bagId]"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="checkout/[orderId]"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="order/confirmed" options={{ headerShown: false }} />
        <Stack.Screen name="order/confirmed/[orderId]" options={{ headerShown: false }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="order/chat/[orderId]" options={{ headerShown: false }} />
        <Stack.Screen name="review/[orderId]" options={{ headerShown: false }} />
        <Stack.Screen
          name="partner/add-bag"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="partner/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="partners/index" options={{ headerShown: false }} />
        <Stack.Screen name="partner/edit-bag/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="partner/reactivate" options={{ headerShown: false }} />
        <Stack.Screen name="partner/edit-business" options={{ headerShown: false }} />
        <Stack.Screen name="partner/edit-location" options={{ headerShown: false }} />
        <Stack.Screen name="partner/edit-hours" options={{ headerShown: false }} />
        <Stack.Screen name="partner/reports" options={{ headerShown: false }} />
        <Stack.Screen name="legal/terms" options={{ headerShown: false }} />
        <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
        <Stack.Screen name="legal/about" options={{ headerShown: false }} />
        <Stack.Screen name="support/help" options={{ headerShown: false }} />
        <Stack.Screen name="messages/index" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="notifications/preferences" options={{ headerShown: false }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
        <Stack.Screen name="profile/privacy" options={{ headerShown: false }} />
        <Stack.Screen name="admin/subscriptions" options={{ title: 'Subscriptions', headerShown: true }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="payment/callback" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
