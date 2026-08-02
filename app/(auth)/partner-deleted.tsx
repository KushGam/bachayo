import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';
import { performSignOut } from '@/lib/auth/performSignOut';

export default function PartnerDeletedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void (async () => {
      await performSignOut();
      router.replace('/(auth)/welcome?accountRemoved=1');
    })();
  }, [router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32 }]}>
      <ActivityIndicator color={Palette.primary} />
      <Text style={styles.text}>Signing you out…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
});
