import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Mail, MessageCircle } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MANUAL_BILLING, PLAN_FEATURES } from '@/constants/manualBilling';
import type { SubscriptionStatus, SubscriptionTier } from '@/constants/subscriptions';
import { DEFAULT_TIER_PRICING } from '@/constants/subscriptions';
import { Palette } from '@/constants/Colors';
import { fetchSubscriptionPayments } from '@/lib/subscriptionBilling';
import {
  formatSubscriptionDate,
  getDaysUntil,
  getSubscriptionExpiryIso,
  getTrialDaysRemaining,
  type PartnerSubscriptionFields,
} from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';

type PartnerRow = PartnerSubscriptionFields & {
  id: string;
  name: string;
  phone?: string | null;
  user_id: string;
};

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  tier: string;
  payment_method: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

type DurationMonths = 1 | 3 | 12;

const TIERS: SubscriptionTier[] = ['small', 'medium', 'large'];
const DURATIONS: DurationMonths[] = [1, 3, 12];
const PLAN_NAMES: Record<SubscriptionTier, string> = {
  small: 'Small Plan',
  medium: 'Medium Plan',
  large: 'Large Plan',
};
const SUPPORT_PHONE_DISPLAY = '9762623241';

function tierMonthlyPrice(tier: SubscriptionTier) {
  return DEFAULT_TIER_PRICING[tier].monthlyPriceNpr;
}

function planAmount(tier: SubscriptionTier, months: DurationMonths) {
  const monthly = tierMonthlyPrice(tier);
  if (months === 1) return monthly;
  if (months === 3) return Math.round(monthly * 3 * 0.95);
  return Math.round(monthly * 12 * 0.9);
}

function planSavings(tier: SubscriptionTier, months: DurationMonths) {
  if (months === 1) return 0;
  return tierMonthlyPrice(tier) * months - planAmount(tier, months);
}

function formatNpr(amount: number) {
  return amount.toLocaleString('en-NP');
}

function monthsBetween(start: string | null, end: string | null) {
  if (!start || !end) return 1;
  const a = new Date(start);
  const b = new Date(end);
  const months =
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return Math.max(1, months || 1);
}

export default function PartnerSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [partner, setPartner] = useState<PartnerRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('small');
  const [selectedMonths, setSelectedMonths] = useState<DurationMonths>(1);
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
      const { data: partnerData } = await supabase
        .from('partners')
        .select(
          'id, user_id, name, phone, subscription_tier, subscription_status, trial_ends_at, current_period_end, current_period_start, is_active',
        )
        .eq('user_id', userId)
        .maybeSingle();

      if (partnerData) {
        const row = partnerData as PartnerRow;
        setPartner(row);
        setSelectedTier((row.subscription_tier ?? 'small') as SubscriptionTier);
        const { data: paymentRows } = await fetchSubscriptionPayments(row.id);
        setPayments(((paymentRows ?? []) as PaymentRow[]).slice(0, 6));
      }
    } catch (err) {
      console.error('[subscription] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tier = (partner?.subscription_tier ?? 'small') as SubscriptionTier;
  const status = (partner?.subscription_status ?? 'trial') as SubscriptionStatus;
  const expiryIso = getSubscriptionExpiryIso(partner);
  const daysUntilExpiry = getDaysUntil(expiryIso);
  const trialDays = getTrialDaysRemaining(partner?.trial_ends_at);

  const amountDue = useMemo(
    () => planAmount(selectedTier, selectedMonths),
    [selectedMonths, selectedTier],
  );
  const savings = useMemo(
    () => planSavings(selectedTier, selectedMonths),
    [selectedMonths, selectedTier],
  );

  const openWhatsApp = () => {
    const planName = PLAN_NAMES[selectedTier];
    const message = encodeURIComponent(
      `Hi LastBag! I'd like to subscribe.\n\n` +
        `Plan: ${planName}\n` +
        `Duration: ${selectedMonths} month(s)\n` +
        `Amount: NPR ${formatNpr(amountDue)}\n` +
        `Restaurant: ${partner?.name ?? ''}\n\n` +
        `Please send me payment details.`,
    );
    Linking.openURL(
      `whatsapp://send?phone=${MANUAL_BILLING.whatsappPhone}&text=${message}`,
    ).catch(() =>
      Linking.openURL(`https://wa.me/${MANUAL_BILLING.whatsappPhone}?text=${message}`),
    );
  };

  const openEmail = () => {
    const planName = PLAN_NAMES[selectedTier];
    const subject = encodeURIComponent(
      `LastBag Subscription — ${planName} (${selectedMonths} month)`,
    );
    const body = encodeURIComponent(
      `Hi LastBag team,\n\n` +
        `I would like to subscribe to LastBag.\n\n` +
        `Plan: ${planName}\n` +
        `Duration: ${selectedMonths} month(s)\n` +
        `Amount: NPR ${formatNpr(amountDue)}\n` +
        `Restaurant name: ${partner?.name ?? ''}\n` +
        `Contact number: ${partner?.phone ?? ''}\n\n` +
        `Please send me payment details.\n\n` +
        `Thank you!`,
    );
    void Linking.openURL(
      `mailto:${MANUAL_BILLING.supportEmail}?subject=${subject}&body=${body}`,
    );
  };

  if (loading && !partner) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading subscription…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerTop}>
            <Pressable
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace('/(tabs)/partner/profile')
              }
              style={styles.backBtn}
              hitSlop={8}>
              <ChevronLeft size={22} color="#FFF" strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.headerTitle}>Subscription & Billing</Text>
            <View style={styles.headerSpacer} />
          </View>

          <CurrentPlanCard
            tier={tier}
            status={status}
            partnerName={partner?.name ?? 'Your restaurant'}
            trialDays={trialDays}
            daysUntilExpiry={daysUntilExpiry}
            expiryIso={expiryIso}
          />
        </View>

        <Text style={styles.sectionLabel}>CHOOSE YOUR PLAN</Text>
        {TIERS.map((planTier) => (
          <PlanOptionCard
            key={planTier}
            tier={planTier}
            isCurrent={planTier === tier}
            selected={planTier === selectedTier}
            onSelect={() => setSelectedTier(planTier)}
          />
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>HOW LONG?</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((months) => {
            const selected = selectedMonths === months;
            return (
              <Pressable
                key={months}
                onPress={() => setSelectedMonths(months)}
                style={[styles.durationPill, selected && styles.durationPillSelected]}>
                <Text style={[styles.durationTitle, selected && styles.durationTitleSelected]}>
                  {months} month{months === 1 ? '' : 's'}
                </Text>
                <Text
                  style={[
                    styles.durationSaving,
                    months > 1 ? styles.durationSavingGreen : null,
                  ]}>
                  {months === 1 ? 'standard' : months === 3 ? 'save 5%' : 'save 10%'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount due</Text>
            <Text style={styles.amountValue}>NPR {formatNpr(amountDue)}</Text>
          </View>
          <Text style={styles.amountMeta}>
            {PLAN_NAMES[selectedTier]} · {selectedMonths} month
            {selectedMonths === 1 ? '' : 's'}
          </Text>
          {savings > 0 ? (
            <View style={styles.savingsPill}>
              <Text style={styles.savingsText}>You save NPR {formatNpr(savings)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>HOW TO SUBSCRIBE</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Contact us with your selected plan and we&apos;ll send you payment details and activate
            your subscription within 2 hours.
          </Text>
        </View>

        <Pressable
          onPress={openWhatsApp}
          style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.92 }]}>
          <View style={styles.whatsappIconWrap}>
            <MessageCircle size={22} color="#FFF" strokeWidth={2.2} fill="#FFF" />
          </View>
          <View style={styles.contactCopy}>
            <Text style={styles.whatsappTitle}>Message us on WhatsApp</Text>
            <Text style={styles.whatsappSub}>
              {SUPPORT_PHONE_DISPLAY} · Usually replies in 2 hrs
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={openEmail}
          style={({ pressed }) => [styles.emailBtn, pressed && { opacity: 0.92 }]}>
          <View style={styles.emailIconWrap}>
            <Mail size={22} color="#D85A30" strokeWidth={2.2} />
          </View>
          <View style={styles.contactCopy}>
            <Text style={styles.emailTitle}>Email us</Text>
            <Text style={styles.emailSub}>{MANUAL_BILLING.supportEmail}</Text>
          </View>
        </Pressable>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PAYMENT HISTORY</Text>
        {payments.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryTitle}>No payments yet</Text>
            <Text style={styles.emptyHistoryBody}>
              Your payment history will appear here
            </Text>
          </View>
        ) : (
          payments.map((payment) => <PaymentHistoryRow key={payment.id} payment={payment} />)
        )}

        <View style={styles.helpBlock}>
          <Text style={styles.helpLabel}>Questions? Call us:</Text>
          <Pressable onPress={() => void Linking.openURL('tel:+9779762623241')} hitSlop={8}>
            <Text style={styles.helpPhone}>{SUPPORT_PHONE_DISPLAY}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function CurrentPlanCard({
  tier,
  status,
  partnerName,
  trialDays,
  daysUntilExpiry,
  expiryIso,
}: {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  partnerName: string;
  trialDays: number;
  daysUntilExpiry: number | null;
  expiryIso: string | null;
}) {
  const price = tierMonthlyPrice(tier);
  const daysLeft =
    status === 'trial'
      ? trialDays
      : daysUntilExpiry !== null
        ? Math.max(0, daysUntilExpiry)
        : 0;

  const expired =
    status === 'past_due' ||
    status === 'paused' ||
    status === 'cancelled' ||
    (daysUntilExpiry !== null && daysUntilExpiry < 0 && status !== 'trial');

  const expiringSoon =
    !expired &&
    status === 'active' &&
    daysUntilExpiry !== null &&
    daysUntilExpiry >= 0 &&
    daysUntilExpiry < 7;

  let statusLabel = '✅ Subscription active';
  let statusBg = 'rgba(255,255,255,0.18)';
  if (expired) {
    statusLabel = '🚫 Subscription expired';
    statusBg = 'rgba(252,165,165,0.28)';
  } else if (expiringSoon) {
    statusLabel = '⚠️ Renew soon';
    statusBg = 'rgba(253,230,138,0.28)';
  } else if (status === 'trial') {
    statusLabel = `✨ Free trial — ${trialDays} day${trialDays === 1 ? '' : 's'} left`;
    statusBg = 'rgba(255,255,255,0.18)';
  }

  const progressSource = status === 'trial' ? trialDays : daysLeft;
  const progressPct = Math.min(100, Math.max(0, (progressSource / 30) * 100));
  let fillColor = '#FFFFFF';
  if (expired) fillColor = '#FCA5A5';
  else if (progressSource < 7) fillColor = '#FDE68A';

  return (
    <View style={styles.currentCard}>
      <View style={styles.currentTop}>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{PLAN_NAMES[tier]}</Text>
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.priceMain}>NPR {formatNpr(price)}</Text>
          <Text style={styles.priceUnit}>/month</Text>
        </View>
      </View>

      <Text style={styles.partnerName}>{partnerName}</Text>

      <View style={styles.expiryRow}>
        <Text style={styles.expiryText}>Expires {formatSubscriptionDate(expiryIso)}</Text>
        <Text style={styles.expiryText}>
          {expired ? 'Expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${expired ? 100 : progressPct}%`, backgroundColor: fillColor },
          ]}
        />
      </View>

      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
        <Text style={styles.statusBadgeText}>{statusLabel}</Text>
      </View>
    </View>
  );
}

function PlanOptionCard({
  tier,
  isCurrent,
  selected,
  onSelect,
}: {
  tier: SubscriptionTier;
  isCurrent: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = PLAN_FEATURES[tier];
  const price = tierMonthlyPrice(tier);

  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.optionCard,
        selected ? styles.optionCardSelected : null,
        meta.popular ? { marginTop: 14 } : null,
      ]}>
      {meta.popular ? (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most popular</Text>
        </View>
      ) : null}

      {isCurrent ? (
        <View style={styles.currentPlanBadge}>
          <Text style={styles.currentPlanBadgeText}>Current plan ✓</Text>
        </View>
      ) : null}

      <View style={[styles.optionTop, isCurrent && styles.optionTopWithBadge]}>
        <Text style={styles.optionTitle}>{meta.title}</Text>
        <Text style={styles.optionPrice}>NPR {formatNpr(price)}/mo</Text>
      </View>

      <View style={styles.featureList}>
        {meta.features.map((feature) => (
          <Text key={feature} style={styles.featureText}>
            ✓ {feature}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

function PaymentHistoryRow({ payment }: { payment: PaymentRow }) {
  const method = (payment.payment_method ?? 'P').trim();
  const initial = method ? method.charAt(0).toUpperCase() : 'P';
  const paid = payment.status === 'paid' || payment.status === 'completed';
  const pending = payment.status === 'pending';
  const months = monthsBetween(payment.period_start, payment.period_end);
  const tierLabel =
    (payment.tier || 'plan').charAt(0).toUpperCase() + (payment.tier || 'plan').slice(1);

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyIcon}>
        <Text style={styles.historyIconText}>{initial}</Text>
      </View>
      <View style={styles.historyCenter}>
        <Text style={styles.historyAmount}>NPR {formatNpr(Number(payment.amount))}</Text>
        <Text style={styles.historyMeta}>
          {tierLabel} · {months} month{months === 1 ? '' : 's'}
        </Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyDate}>{formatSubscriptionDate(payment.created_at)}</Text>
        <View
          style={[
            styles.statusPill,
            paid ? styles.statusPaid : pending ? styles.statusPending : styles.statusFailed,
          ]}>
          <Text
            style={[
              styles.statusPillText,
              paid
                ? { color: '#065F46' }
                : pending
                  ? { color: '#92400E' }
                  : { color: '#991B1B' },
            ]}>
            {paid ? '✓ Paid' : pending ? 'Pending' : 'Failed'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  loadingText: { color: Palette.textSecondary, fontWeight: '600' },
  header: {
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: { width: 36 },
  currentCard: {
    backgroundColor: '#D85A30',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
  },
  currentTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  planBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceMain: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  priceUnit: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 1,
  },
  partnerName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 8,
  },
  expiryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  expiryText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 12,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#6B7280',
  },
  optionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: 'visible',
  },
  optionCardSelected: {
    borderColor: '#D85A30',
    backgroundColor: '#FAECE7',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: '#D85A30',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    zIndex: 2,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  currentPlanBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: '#D85A30',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  currentPlanBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  optionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTopWithBadge: {
    paddingRight: 96,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  optionPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D85A30',
  },
  featureList: {
    marginTop: 8,
    gap: 5,
  },
  featureText: {
    fontSize: 12,
    color: '#4B5563',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
  },
  durationPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  durationPillSelected: {
    borderColor: '#D85A30',
    backgroundColor: '#FAECE7',
  },
  durationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  durationTitleSelected: {
    color: '#993C1D',
  },
  durationSaving: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  durationSavingGreen: {
    color: '#059669',
    fontWeight: '600',
  },
  amountCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D85A30',
  },
  amountMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  savingsPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#F5F3EF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  whatsappIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCopy: {
    flex: 1,
  },
  whatsappTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  whatsappSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  emailBtn: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
  emailSub: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  emptyHistory: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyHistoryTitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHistoryBody: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  historyRow: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  historyCenter: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  historyMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPaid: { backgroundColor: '#ECFDF5' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusFailed: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  helpBlock: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  helpLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  helpPhone: {
    color: '#D85A30',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
});
