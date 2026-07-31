import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/theme';
import { PARTNER_SUPPORT_WHATSAPP } from '@/lib/auth/authErrors';
import { openWhatsAppChat } from '@/lib/helpers';
import { markIntentionalSignOut } from '@/lib/auth/signOutIntent';
import { getPartnerApprovalStatus, type PartnerApprovalFields } from '@/lib/partnerApproval';
import { clearPushTokenForCurrentUser } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function PartnerSuspendedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuthRole = useAuthStore((s) => s.setAuthRole);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        router.replace('/(auth)/welcome');
        return;
      }

      const { data: partner } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const approval = partner as PartnerApprovalFields | null;
      const status = getPartnerApprovalStatus(approval);

      if (status === 'approved') {
        router.replace('/(tabs)/partner/dashboard');
        return;
      }
      if (status === 'pending') {
        router.replace('/(auth)/partner-pending');
        return;
      }
      if (status === 'rejected') {
        router.replace('/(auth)/partner-rejected');
        return;
      }
      if (status === 'deleted') {
        router.replace('/(auth)/partner-deleted');
        return;
      }

      setReason(approval?.suspension_reason ?? null);
    })();
  }, [router]);

  const signOut = useCallback(async () => {
    markIntentionalSignOut();
    await clearPushTokenForCurrentUser();
    await supabase.auth.signOut();
    setAuthRole(null);
    router.replace('/(auth)/welcome');
  }, [router, setAuthRole]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
      ]}>
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>⚠️</Text>
        </View>
        <Text style={styles.title}>Account suspended ⚠️</Text>
        <Text style={styles.subtitle}>
          Your account has been suspended. Please contact us to resolve this.
        </Text>
        {reason ? (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonLabel}>Reason</Text>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={styles.contactButton}
        onPress={() =>
          void openWhatsAppChat({
            phone: PARTNER_SUPPORT_WHATSAPP,
            message: 'Hi! My LastBag partner account was suspended. Can you help?',
          })
        }>
        <Text style={styles.contactButtonText}>Contact support →</Text>
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
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    width: '100%',
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
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  reasonCard: {
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  contactButton: {
    marginTop: 32,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minWidth: 220,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.white,
  },
  signOutButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
