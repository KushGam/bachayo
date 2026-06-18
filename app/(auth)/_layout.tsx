import { Stack } from 'expo-router';

import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';

export default function AuthLayout() {
  return (
    <ScreenErrorBoundary fallbackTitle="Auth screen error">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F9F9F7' },
          animation: 'slide_from_right',
        }}
      />
    </ScreenErrorBoundary>
  );
}
