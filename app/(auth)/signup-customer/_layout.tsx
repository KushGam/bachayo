import { Stack } from 'expo-router';

import { Palette } from '@/constants/Colors';

export default function SignupCustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
        contentStyle: { backgroundColor: Palette.background },
      }}
    />
  );
}
