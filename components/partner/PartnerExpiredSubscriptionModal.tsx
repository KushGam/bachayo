import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MANUAL_BILLING } from '@/constants/manualBilling';
import { Palette } from '@/constants/Colors';
import { getDaysUntil, getSubscriptionExpiryIso } from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Non-dismissable gate when a partner subscription is expired / past due.
 * Hidden while on the billing screen so they can complete payment.
 */
export function PartnerExpiredSubscriptionModal() {
  const router = useRouter();
  const pathname = usePathname();
  const authRole = useAuthStore((s) => s.authRole);
  const [expired, setExpired] = useState(false);

  const onBillingScreen = Boolean(pathname?.includes('subscription'));

  const check = useCallback(async () => {
    if (authRole !== 'partner') {
      setExpired(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setExpired(false);
      return;
    }

    const { data } = await supabase
      .from('partners')
      .select('subscription_status, trial_ends_at, current_period_end, is_active')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) {
      setExpired(false);
      return;
    }

    const status = data.subscription_status ?? 'trial';
    if (status === 'past_due' || status === 'paused' || status === 'cancelled') {
      setExpired(true);
      return;
    }

    const expiry = getSubscriptionExpiryIso(data);
    const days = getDaysUntil(expiry);
    if (status === 'active' && days !== null && days < 0) {
      setExpired(true);
      return;
    }

    setExpired(false);
  }, [authRole]);

  useEffect(() => {
    void check();
  }, [check, pathname]);

  const visible = expired && !onBillingScreen;

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      'Hi! My LastBag subscription has expired. Please help me renew.',
    );
    Linking.openURL(
      `whatsapp://send?phone=${MANUAL_BILLING.whatsappPhone}&text=${message}`,
    ).catch(() =>
      Linking.openURL(`https://wa.me/${MANUAL_BILLING.whatsappPhone}?text=${message}`),
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Your subscription has expired</Text>
          <Text style={styles.body}>
            Renew to continue listing rescue bags. Your bags are hidden from customers until
            payment is confirmed.
          </Text>

          <Pressable
            onPress={() => router.push('/(tabs)/partner/subscription')}
            style={styles.primaryBtn}>
            <Text style={styles.primaryText}>View billing options</Text>
          </Pressable>

          <Pressable onPress={openWhatsApp} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Contact support</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 999,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    marginTop: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#374151', fontSize: 14, fontWeight: '600' },
});
