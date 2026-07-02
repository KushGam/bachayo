import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { SubscriptionStatusBadge } from '@/components/partner/SubscriptionStatusBadge';
import { Button } from '@/components/ui/Button';
import type { PaymentGateway } from '@/constants/payments';
import type { SubscriptionTier } from '@/constants/subscriptions';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import {
  activatePartnerSubscription,
  fetchTierPricing,
  getSubscriptionAmountNpr,
} from '@/lib/subscriptionBilling';
import { formatTierPrice, getTierPricing } from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';

export default function PartnerReactivateScreen() {
  const router = useRouter();
  const [partner, setPartner] = useState<{
    id: string;
    subscription_tier: SubscriptionTier;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<Parameters<typeof getTierPricing>[1]>(null);

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    const [{ data }, pricingResult] = await Promise.all([
      supabase
        .from('partners')
        .select('id, name, subscription_tier, subscription_status')
        .eq('user_id', userId)
        .maybeSingle(),
      fetchTierPricing(),
    ]);

    if (data) {
      setPartner({
        id: data.id,
        name: data.name,
        subscription_tier: (data.subscription_tier ?? 'small') as SubscriptionTier,
      });
    }
    if (pricingResult.data) {
      setPricing(pricingResult.data as Parameters<typeof getTierPricing>[1]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tierInfo = partner ? getTierPricing(partner.subscription_tier, pricing) : null;

  const startPayment = async (gateway: PaymentGateway) => {
    if (!partner || !tierInfo) return;
    setLoading(true);
    setError(null);

    const amountNpr = getSubscriptionAmountNpr(partner.subscription_tier, pricing);
    const mask = gateway === 'esewa' ? '****1234' : '****5678';
    const paymentRef = `${gateway}_${Date.now()}`;

    const { error: activateError } = await activatePartnerSubscription({
      partnerId: partner.id,
      tier: partner.subscription_tier,
      paymentMethod: gateway,
      paymentMask: mask,
      paymentRef,
      amountNpr,
    });

    setLoading(false);

    if (activateError) {
      setError(activateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.replace('/(tabs)/partner/dashboard');
    }, 2000);
  };

  if (success) {
    return (
      <View style={styles.successScreen}>
        <Animated.View entering={ZoomIn.duration(320)} style={styles.successBadge}>
          <Text style={styles.successEmoji}>🎉</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(120)} style={styles.successTitle}>
          You&apos;re live again!
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(220)} style={styles.successSubtitle}>
          Your listings are visible to customers.
        </Animated.Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Welcome back — reactivate your account</Text>
      <Text style={styles.subtitle}>
        Add a payment method to restore your rescue bag listings. You still keep 100% of every sale.
      </Text>

      {tierInfo ? (
        <View style={styles.planCard}>
          <Text style={styles.planName}>{partner?.name}</Text>
          <Text style={styles.planPrice}>{formatTierPrice(tierInfo.monthly_price_npr)}</Text>
          <SubscriptionStatusBadge status="paused" />
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Add payment method</Text>
      <Button
        label="Pay with eSewa"
        onPress={() => startPayment('esewa')}
        loading={loading}
        disabled={!partner}
      />
      <Button
        label="Pay with Khalti"
        variant="secondary"
        onPress={() => startPayment('khalti')}
        loading={loading}
        disabled={!partner}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label="Back to dashboard"
        variant="ghost"
        size="md"
        onPress={() => router.back()}
        style={styles.back}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.xl, gap: Spacing.lg },
  title: { ...Type.h1, color: Palette.textPrimary },
  subtitle: { ...Type.body, color: Palette.textSecondary },
  planCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: Border.width,
    borderColor: Palette.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  planName: { ...Type.h2, color: Palette.textPrimary },
  planPrice: { ...Type.bodyMedium, fontWeight: '700', color: Palette.primary },
  sectionLabel: { ...Type.label, color: Palette.textSecondary, textTransform: 'uppercase' },
  error: { ...Type.caption, color: Palette.dangerText, textAlign: 'center' },
  back: { marginTop: Spacing.md },
  successScreen: {
    flex: 1,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: { fontSize: 40 },
  successTitle: { ...Type.h1, color: Palette.white, textAlign: 'center' },
  successSubtitle: { ...Type.body, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
});
