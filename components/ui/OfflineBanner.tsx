import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    return () => unsubscribe();
  }, []);

  return { isOffline };
}

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
      <Text style={styles.text}>You&apos;re offline — showing cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Palette.warningBg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 106, 30, 0.15)',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  text: {
    color: Palette.warning,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
});
