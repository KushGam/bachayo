import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TermsCheckbox } from '@/components/auth/TermsCheckbox';
import { BrandedLoading } from '@/components/brand/BrandedLoading';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { fetchUserRole } from '@/lib/auth';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { clearPushTokenForCurrentUser } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { hasAcceptedTerms, recordTermsAcceptance } from '@/lib/terms';
import { useAuthStore } from '@/store/useAuthStore';

const BENEFITS = [
  'Your personal data is never sold',
  'Free to reserve — pay at pickup only',
  'Cancel reservations anytime',
] as const;

/** Full-screen gate (not a Modal) so Terms / Privacy links can scroll normally. */
export default function AcceptTermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuthRole = useAuthStore((s) => s.setAuthRole);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (!uid) {
        router.replace('/(auth)/welcome');
        return;
      }

      if (await hasAcceptedTerms(uid)) {
        const role = await fetchUserRole(uid);
        setAuthRole(role ?? 'customer');
        router.replace(await resolveAuthenticatedRoute(uid, role ?? 'customer'));
        return;
      }

      setUserId(uid);
      setReady(true);
    })();
  }, [router, setAuthRole]);

  const onAccept = async () => {
    if (!userId || loading) return;
    if (!accepted) {
      Alert.alert(
        'Please accept terms',
        'You must agree to our Terms of Service and Privacy Policy to continue.',
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await recordTermsAcceptance(userId);
      if (error) throw new Error(error.message);
      const role = await fetchUserRole(userId);
      setAuthRole(role ?? 'customer');
      router.replace(await resolveAuthenticatedRoute(userId, role ?? 'customer'));
    } catch (err) {
      Alert.alert(
        'Could not save',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    Alert.alert(
      'Leave without accepting?',
      'You need to accept the terms to use LastBag. Cancel will sign you out.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await clearPushTokenForCurrentUser();
              await supabase.auth.signOut();
              setAuthRole(null);
              router.replace('/(auth)/welcome');
            })();
          },
        },
      ],
    );
  };

  if (!ready || !userId) {
    return <BrandedLoading />;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.md }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Almost there!</Text>
        <Text style={styles.subtitle}>
          Please review and accept our terms before continuing with LastBag
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((item) => (
            <View key={item} style={styles.benefitRow}>
              <View style={styles.benefitCheck}>
                <Text style={styles.benefitCheckText}>✓</Text>
              </View>
              <Text style={styles.benefitText}>{item}</Text>
            </View>
          ))}
        </View>

        <TermsCheckbox accepted={accepted} onToggle={() => setAccepted((v) => !v)} />

        <Pressable
          onPress={() => void onAccept()}
          disabled={loading}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: accepted
                ? pressed || loading
                  ? Palette.primaryDark
                  : Palette.primary
                : '#F0EDE8',
            },
          ]}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Palette.white} />
              <Text style={styles.primaryBtnText}>Saving…</Text>
            </View>
          ) : (
            <Text style={[styles.primaryBtnText, !accepted && styles.primaryBtnTextDisabled]}>
              Continue →
            </Text>
          )}
        </Pressable>

        <Pressable onPress={onCancel} disabled={loading} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  benefits: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  benefitCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCheckText: {
    fontSize: 12,
    color: Palette.success,
    fontWeight: '700',
  },
  benefitText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  primaryBtn: {
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  primaryBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBtnTextDisabled: {
    color: '#9CA3AF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    marginTop: Spacing.md,
    padding: 8,
  },
  cancelText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});
