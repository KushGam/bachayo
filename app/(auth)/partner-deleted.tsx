import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';
import { clearPushTokenForCurrentUser } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function PartnerDeletedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuthRole = useAuthStore((s) => s.setAuthRole);

  useEffect(() => {
    void (async () => {
      await clearPushTokenForCurrentUser();
      await supabase.auth.signOut();
      setAuthRole(null);
      router.replace('/(auth)/welcome?accountRemoved=1');
    })();
  }, [router, setAuthRole]);

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
