import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';
import { useColorScheme } from '@/components/useColorScheme';
import { useNotificationObserver, usePushTokenRegistration } from '@/hooks/useNotifications';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { initAnalytics } from '@/lib/analytics';
import Colors, { Palette } from '@/constants/Colors';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

void SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('[boot] preventAutoHideAsync failed:', error);
});

export default function RootLayout() {
  console.log('[boot] layout mounted');

  useEffect(() => {
    try {
      initAnalytics();
    } catch (error) {
      console.error('[boot] initAnalytics failed:', error);
    }
  }, []);

  const hideSplash = useCallback(async () => {
    try {
      console.log('[boot] hiding splash');
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error('[boot] SplashScreen.hideAsync failed:', error);
    }
  }, []);

  const onRootLayout = useCallback(() => {
    void hideSplash();
  }, [hideSplash]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onRootLayout}>
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
  const colors = Colors[colorScheme];

  usePushTokenRegistration();
  useNotificationObserver();
  useUnreadNotifications();

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
        <Stack.Screen name="review/[orderId]" options={{ headerShown: false }} />
        <Stack.Screen
          name="partner/add-bag"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="partner/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="partner/edit-bag/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="partner/reactivate" options={{ headerShown: false }} />
        <Stack.Screen name="partner/edit-business" options={{ headerShown: false }} />
        <Stack.Screen name="partner/edit-location" options={{ headerShown: false }} />
        <Stack.Screen name="partner/edit-hours" options={{ headerShown: false }} />
        <Stack.Screen name="legal/terms" options={{ headerShown: false }} />
        <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
        <Stack.Screen name="legal/about" options={{ headerShown: false }} />
        <Stack.Screen name="support/help" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="notifications/preferences" options={{ headerShown: false }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
        <Stack.Screen name="admin/subscriptions" options={{ title: 'Subscriptions', headerShown: true }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="payment/callback" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
