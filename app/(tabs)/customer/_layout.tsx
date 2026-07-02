import { Tabs } from 'expo-router';
import { Home, Map, ShoppingBag, User } from 'lucide-react-native';
import { Platform, StyleSheet } from 'react-native';

import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';
import { Palette } from '@/constants/Colors';

export default function CustomerTabLayout() {
  return (
    <ScreenErrorBoundary fallbackTitle="Something went wrong">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Palette.primary,
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            lazy: true,
            tabBarIcon: ({ color }) => <Map size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="my-bags"
          options={{
            title: 'My Bags',
            tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Palette.white,
    borderTopWidth: 0,
    height: 84,
    paddingBottom: 24,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});
