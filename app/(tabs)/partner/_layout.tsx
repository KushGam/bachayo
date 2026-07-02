import { Tabs } from 'expo-router';
import { LayoutGrid, QrCode, ShoppingBag, Star, User } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';

import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';
import { Palette } from '@/constants/Colors';

function ScanTabIcon() {
  return (
    <View style={styles.scanButton}>
      <QrCode size={24} color="#FFFFFF" strokeWidth={2} />
    </View>
  );
}

export default function PartnerTabLayout() {
  return (
    <ScreenErrorBoundary fallbackTitle="Something went wrong">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Palette.primary,
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          headerShown: false,
        }}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            headerShown: false,
            tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="my-bags"
          options={{
            title: 'My Bags',
            headerShown: false,
            tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            headerShown: false,
            lazy: true,
            tabBarShowLabel: false,
            tabBarLabel: () => null,
            tabBarItemStyle: styles.scanTabItem,
            tabBarIcon: () => <ScanTabIcon />,
          }}
        />
        <Tabs.Screen
          name="reviews"
          options={{
            title: 'Reviews',
            headerShown: false,
            tabBarIcon: ({ color }) => <Star size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen name="orders" options={{ href: null, lazy: true }} />
        <Tabs.Screen
          name="subscription"
          options={{
            title: 'Subscription & billing',
            href: null,
            lazy: true,
            headerShown: true,
            headerStyle: { backgroundColor: Palette.white },
            headerTintColor: Palette.primary,
            headerShadowVisible: false,
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
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  scanTabItem: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D85A30',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...Platform.select({
      ios: {
        shadowColor: '#D85A30',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
});
