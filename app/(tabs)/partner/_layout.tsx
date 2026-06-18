import { Stack } from 'expo-router';

import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';

export default function PartnerLayout() {
  return (
    <ScreenErrorBoundary fallbackTitle="Partner screen error">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F9F9F7' },
        }}
      />
    </ScreenErrorBoundary>
  );
}
