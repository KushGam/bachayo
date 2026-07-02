import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
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
import { type PartnerApprovalFields } from '@/lib/partnerApproval';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function PartnerRejectedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuthRole = useAuthStore((s) => s.setAuthRole);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;

      const { data: partner } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const approval = partner as PartnerApprovalFields | null;
      if (approval?.approval_status === 'approved') {
        router.replace('/(tabs)/partner/dashboard');
        return;
      }
      if (approval?.approval_status === 'pending') {
        router.replace('/(auth)/partner-pending');
        return;
      }
      if (approval?.approval_status === 'suspended') {
        router.replace('/(auth)/partner-suspended');
        return;
      }
      if (approval?.approval_status === 'deleted') {
        router.replace('/(auth)/partner-deleted');
        return;
      }

      setReason(approval?.rejection_reason ?? null);
    })();
  }, [router]);

  const signOut = useCallback(async () => {
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
          <Text style={styles.iconEmoji}>✗</Text>
        </View>
        <Text style={styles.title}>Application not approved</Text>
        <Text style={styles.subtitle}>
          Unfortunately we can&apos;t approve your Bachayo partner account right now.
        </Text>
        {reason ? (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonLabel}>Reason</Text>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.helpText}>
        If you think this was a mistake, call us and we&apos;ll be happy to discuss.
      </Text>

      <Pressable style={styles.callButton} onPress={() => void Linking.openURL('tel:0405290710')}>
        <Text style={styles.callButtonText}>Call us: 0405 290 710</Text>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 40,
    color: '#DC2626',
    fontWeight: '700',
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
    marginHorizontal: 24,
  },
  reasonCard: {
    marginTop: 20,
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  helpText: {
    marginTop: 28,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  callButton: {
    marginTop: 20,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  callButtonText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '700',
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
