import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { getPartnerApprovalStatus, type PartnerApprovalFields } from '@/lib/partnerApproval';
import { clearPushTokenForCurrentUser } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

const STEPS = [
  {
    icon: '📞',
    text: "We'll call you to verify your restaurant details",
  },
  {
    icon: '✓',
    text: 'Once approved, your dashboard unlocks instantly',
  },
  {
    icon: '🛍',
    text: 'List your first rescue bag and start earning',
  },
] as const;

export default function PartnerPendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuthRole = useAuthStore((s) => s.setAuthRole);
  const [checking, setChecking] = useState(false);

  const checkApprovalStatus = useCallback(async () => {
    setChecking(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        router.replace('/(auth)/welcome');
        return;
      }

      const { data: partner, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !partner) return;

      const status = getPartnerApprovalStatus(partner as PartnerApprovalFields);
      if (status === 'approved') {
        router.replace('/(tabs)/partner/dashboard');
        return;
      }
      if (status === 'rejected') {
        router.replace('/(auth)/partner-rejected');
        return;
      }
      if (status === 'suspended') {
        router.replace('/(auth)/partner-suspended');
        return;
      }
      if (status === 'deleted') {
        router.replace('/(auth)/partner-deleted');
      }
    } finally {
      setChecking(false);
    }
  }, [router]);

  const signOut = useCallback(async () => {
    await clearPushTokenForCurrentUser();
    await supabase.auth.signOut();
    setAuthRole(null);
    router.replace('/(auth)/welcome');
  }, [router, setAuthRole]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>⏰</Text>
        </View>
        <Text style={styles.title}>Application received! 🎉</Text>
        <Text style={styles.subtitle}>
          We&apos;ll review your restaurant and get back to you within 24 hours.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What happens next?</Text>
        {STEPS.map((step) => (
          <View key={step.text} style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>{step.icon}</Text>
            </View>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactLabel}>Questions? Call us:</Text>
        <Pressable onPress={() => void Linking.openURL('tel:0405290710')}>
          <Text style={styles.contactPhone}>0405 290 710</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.checkButton}
        onPress={() => void checkApprovalStatus()}
        disabled={checking}>
        {checking ? (
          <ActivityIndicator color={Palette.primary} />
        ) : (
          <Text style={styles.checkButtonText}>Check approval status</Text>
        )}
      </Pressable>

      <Pressable onPress={() => void signOut()} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 48,
  },
  title: {
    ...Type.h1,
    fontSize: 22,
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 32,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    marginTop: 32,
    padding: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconText: {
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    paddingTop: 6,
  },
  contactSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  contactPhone: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.primary,
    marginTop: 4,
  },
  checkButton: {
    marginTop: 32,
    borderWidth: 1.5,
    borderColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  checkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.primary,
  },
  signOutButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
