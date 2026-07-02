import { Stack } from 'expo-router';

import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabsRootLayout() {
  return (
    <ScreenErrorBoundary fallbackTitle="Tabs failed to load">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="customer" />
        <Stack.Screen name="partner" />
        <Stack.Screen name="home" options={{ href: null }} />
        <Stack.Screen name="explore" options={{ href: null }} />
        <Stack.Screen name="my-bags" options={{ href: null }} />
        <Stack.Screen name="profile" options={{ href: null }} />
      </Stack>
    </ScreenErrorBoundary>
  );
}
