import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { TermsAcceptanceModal } from '@/components/auth/TermsAcceptanceModal';
import { BrandedLoading } from '@/components/brand/BrandedLoading';
import { Palette } from '@/constants/Colors';
import { fetchUserRole } from '@/lib/auth';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { recordTermsAcceptance } from '@/lib/terms';
import { useAuthStore } from '@/store/useAuthStore';

/** Gate for existing sessions / Google users who have not accepted terms yet. */
export default function AcceptTermsScreen() {
  const router = useRouter();
  const setAuthRole = useAuthStore((s) => s.setAuthRole);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (!uid) {
        router.replace('/(auth)/welcome');
        return;
      }
      setUserId(uid);
      setReady(true);
    })();
  }, [router]);

  if (!ready || !userId) {
    return <BrandedLoading />;
  }

  return (
    <View style={styles.screen}>
      <TermsAcceptanceModal
        visible
        onAccept={async () => {
          const { error } = await recordTermsAcceptance(userId);
          if (error) {
            Alert.alert('Could not save', error.message);
            return;
          }
          const role = await fetchUserRole(userId);
          setAuthRole(role ?? 'customer');
          router.replace(await resolveAuthenticatedRoute(userId, role ?? 'customer'));
        }}
        onCancel={async () => {
          await supabase.auth.signOut();
          setAuthRole(null);
          Alert.alert('Sign in cancelled', 'You must accept the terms to use LastBag.');
          router.replace('/(auth)/welcome');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
});
