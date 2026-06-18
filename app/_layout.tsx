import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';
import { useColorScheme } from '@/components/useColorScheme';
import { useNotificationObserver, usePushTokenRegistration } from '@/hooks/useNotifications';
import { initAnalytics } from '@/lib/analytics';
import Colors, { Palette } from '@/constants/Colors';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <ScreenErrorBoundary>
          <RootLayoutNav />
        </ScreenErrorBoundary>
      </View>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  usePushTokenRegistration();
  useNotificationObserver();

  const theme = {
    dark: colorScheme === 'dark',
    colors: {
      primary: Palette.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.lightGreenBg,
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
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="bag/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="checkout/[orderId]" options={{ headerShown: false }} />
        <Stack.Screen name="order/confirmed" options={{ headerShown: false }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="partner/add-bag" options={{ headerShown: false }} />
        <Stack.Screen name="payment/callback" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
