import { Tabs } from 'expo-router';

import { CustomerTabBar } from '@/components/customer/CustomerTabBar';
import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';
import { Palette } from '@/constants/Colors';

export default function CustomerTabLayout() {
  return (
    <ScreenErrorBoundary fallbackTitle="Something went wrong">
      <Tabs
        tabBar={(props) => <CustomerTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Palette.background,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            lazy: true,
          }}
        />
        <Tabs.Screen
          name="my-bags"
          options={{
            title: 'My Bags',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </ScreenErrorBoundary>
  );
}
