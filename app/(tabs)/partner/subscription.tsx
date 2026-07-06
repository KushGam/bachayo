import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SubscriptionStatusBadge } from '@/components/partner/SubscriptionStatusBadge';
import { SubscriptionTierPicker } from '@/components/partner/SubscriptionTierPicker';
import { Button } from '@/components/ui/Button';
import type { SubscriptionStatus, SubscriptionTier } from '@/constants/subscriptions';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { formatNprPaisa } from '@/lib/helpers';
import {
  activatePartnerSubscription,
  countBagsListedThisMonth,
  fetchSubscriptionPayments,
  fetchTierPricing,
  pausePartnerSubscription,
  updatePartnerTier,
} from '@/lib/subscriptionBilling';
import {
  formatSubscriptionDate,
  formatTierPrice,
  getTierPricing,
  getTrialDaysRemaining,
  type PartnerSubscriptionFields,
  type TierPricing,
} from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';
import { fetchPartnerStats } from '@/lib/orders';

type PartnerRow = PartnerSubscriptionFields & {
  id: string;
  name: string;
  user_id: string;
};

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
};

export default function PartnerSubscriptionScreen() {
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerRow | null>(null);
  const [pricing, setPricing] = useState<Parameters<typeof getTierPricing>[1]>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [bagsThisMonth, setBagsThisMonth] = useState(0);
  const [ordersFulfilled, setOrdersFulfilled] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [tierSheetOpen, setTierSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const [{ data: partnerData }, pricingResult] = await Promise.all([
        supabase.from('partners').select('*').eq('user_id', userId).maybeSingle(),
        fetchTierPricing(),
      ]);

      if (partnerData) {
        setPartner(partnerData as PartnerRow);
        const [{ data: paymentRows }, bagCount] = await Promise.all([
          fetchSubscriptionPayments(partnerData.id),
          countBagsListedThisMonth(partnerData.id),
        ]);
        setPayments((paymentRows ?? []) as PaymentRow[]);
        setBagsThisMonth(bagCount.count);
        const partnerStats = await fetchPartnerStats(partnerData.id);
        setOrdersFulfilled(partnerStats.bagsSold);
        setRevenue(partnerStats.totalRevenue);
      }

      if (pricingResult.data) {
        setPricing(pricingResult.data as TierPricing[]);
      }
    } catch (err) {
      console.error('[subscription] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tier = (partner?.subscription_tier ?? 'small') as SubscriptionTier;
  const status = (partner?.subscription_status ?? 'trial') as SubscriptionStatus;
  const tierInfo = getTierPricing(tier, pricing);
  const daysLeft = getTrialDaysRemaining(partner?.trial_ends_at);
  const bagCap = tierInfo.max_bags_per_month;
  const bagProgress = bagCap ? Math.min(1, bagsThisMonth / bagCap) : 0;

  const planSubtitle = useMemo(() => {
    if (status === 'trial') {
      return `Trial ends ${formatSubscriptionDate(partner?.trial_ends_at)} · ${daysLeft} days left`;
    }
    if (status === 'active') {
      return `Renews on ${formatSubscriptionDate(partner?.current_period_end)}`;
    }
    return null;
  }, [daysLeft, partner?.current_period_end, partner?.trial_ends_at, status]);

  const handlePause = () => {
    if (!partner) return;
    Alert.alert(
      'Pause your account?',
      'Your listings will be hidden until you reactivate. Your data is kept safely.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause account',
          style: 'destructive',
          onPress: async () => {
            await pausePartnerSubscription(partner.id);
            await load();
          },
        },
      ],
    );
  };

  const handleTierChange = async (nextTier: SubscriptionTier, avgDailyMeals: number) => {
    if (!partner) return;
    await updatePartnerTier(partner.id, nextTier, avgDailyMeals);
    setTierSheetOpen(false);
    await load();
  };

  if (loading && !partner) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading subscription…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current plan</Text>
        <Text style={styles.planTitle}>
          {tierInfo.label.split('—')[0].trim()} — {formatTierPrice(tierInfo.monthly_price_npr)}
        </Text>
        <SubscriptionStatusBadge status={status} />
        {planSubtitle ? <Text style={styles.planMeta}>{planSubtitle}</Text> : null}
        <Text style={styles.zeroCommission}>You keep 100% of every sale — LastBag takes no commission.</Text>
        <Button label="Change plan" variant="secondary" size="md" onPress={() => setTierSheetOpen(true)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Payment method</Text>
        {partner?.payment_method_on_file ? (
          <>
            <Text style={styles.bodyStrong}>
              {(partner.payment_method_type ?? 'Payment').toUpperCase()} — {partner.payment_method_mask}
            </Text>
            <Button
              label="Change"
              variant="ghost"
              size="md"
              fullWidth={false}
              onPress={() => router.push('/partner/reactivate')}
            />
          </>
        ) : (
          <>
            <Text style={styles.muted}>No payment method added</Text>
            <Button
              label="Add eSewa or Khalti"
              onPress={() => router.push('/partner/reactivate')}
            />
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Usage this month</Text>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Bags listed</Text>
          <Text style={styles.usageValue}>
            {bagsThisMonth}
            {bagCap ? ` / ${bagCap}` : ''}
          </Text>
        </View>
        {bagCap ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${bagProgress * 100}%` }]} />
          </View>
        ) : null}
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Orders fulfilled</Text>
          <Text style={styles.usageValue}>{ordersFulfilled}</Text>
        </View>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Revenue earned</Text>
          <Text style={styles.usageValue}>{formatNprPaisa(revenue)}</Text>
        </View>
        <Text style={styles.keepAll}>Entirely yours — no commission deducted.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Billing history</Text>
        {payments.length === 0 ? (
          <Text style={styles.muted}>No payments yet</Text>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.paymentRow}>
              <View>
                <Text style={styles.bodyStrong}>{formatNprPaisa(payment.amount * 100)}</Text>
                <Text style={styles.muted}>
                  {formatSubscriptionDate(payment.created_at)}
                  {payment.payment_method ? ` · ${payment.payment_method}` : ''}
                </Text>
              </View>
              <Text
                style={[
                  styles.paymentStatus,
                  payment.status === 'paid' ? styles.paid : styles.failed,
                ]}>
                {payment.status === 'paid' ? 'Paid' : 'Failed'}
              </Text>
            </View>
          ))
        )}
      </View>

      <Pressable onPress={handlePause} style={styles.dangerZone}>
        <Text style={styles.dangerText}>Pause my account</Text>
      </Pressable>

      <Modal visible={tierSheetOpen} animationType="slide" transparent>
        <Pressable style={styles.sheetBackdrop} onPress={() => setTierSheetOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Change plan</Text>
          <SubscriptionTierPicker
            value={tier}
            onChange={handleTierChange}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.lg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Type.body, color: Palette.textSecondary },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: Border.width,
    borderColor: Palette.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardLabel: {
    ...Type.label,
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  planTitle: { ...Type.h2, color: Palette.textPrimary },
  planMeta: { ...Type.caption, color: Palette.textSecondary },
  zeroCommission: { ...Type.caption, color: Palette.primaryDark, fontWeight: '600' },
  bodyStrong: { ...Type.bodyMedium, fontWeight: '700', color: Palette.textPrimary },
  muted: { ...Type.caption, color: Palette.textSecondary },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: { ...Type.body, color: Palette.textSecondary },
  usageValue: { ...Type.bodyMedium, fontWeight: '700', color: Palette.textPrimary },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Palette.imagePlaceholder,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
  },
  keepAll: { ...Type.caption, color: Palette.primaryDark, fontWeight: '600' },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: Border.width,
    borderBottomColor: Palette.border,
  },
  paymentStatus: { ...Type.label, fontWeight: '700' },
  paid: { color: '#3B6D11' },
  failed: { color: '#993C1D' },
  dangerZone: { alignItems: 'center', paddingVertical: Spacing.xl },
  dangerText: { ...Type.bodyMedium, color: Palette.textSecondary, textDecorationLine: 'underline' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  sheetTitle: { ...Type.h2, marginBottom: Spacing.lg },
});
