import { Tabs } from 'expo-router';
import { LayoutGrid, QrCode, ShoppingBag, Star, User } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';

import { PartnerExpiredSubscriptionModal } from '@/components/partner/PartnerExpiredSubscriptionModal';
import { ScreenErrorBoundary } from '@/components/ui/ScreenErrorBoundary';

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
          tabBarActiveTintColor: '#D85A30',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
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
            headerShown: false,
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
      <PartnerExpiredSubscriptionModal />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 0,
    height: 84,
    paddingBottom: 24,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 20,
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
        shadowOpacity: 0.5,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
});
