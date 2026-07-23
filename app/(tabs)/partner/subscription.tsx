import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SuccessToast } from '@/components/ui/SuccessToast';
import { MANUAL_BILLING, PLAN_FEATURES } from '@/constants/manualBilling';
import type { SubscriptionStatus, SubscriptionTier } from '@/constants/subscriptions';
import { DEFAULT_TIER_PRICING } from '@/constants/subscriptions';
import { Palette } from '@/constants/Colors';
import {
  fetchSubscriptionPayments,
} from '@/lib/subscriptionBilling';
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

const TIERS: SubscriptionTier[] = ['small', 'medium', 'large'];

function tierPrice(tier: SubscriptionTier) {
  return DEFAULT_TIER_PRICING[tier].monthlyPriceNpr;
}

function tierBadgeStyle(tier: SubscriptionTier) {
  if (tier === 'small') return { bg: '#FEF3C7', text: '#92400E' };
  if (tier === 'medium') return { bg: '#FAECE7', text: '#D85A30' };
  return { bg: '#1A1A1A', text: '#FFFFFF' };
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
  const [loading, setLoading] = useState(true);
  const [copiedToast, setCopiedToast] = useState(false);

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
        setPayments(((paymentRows ?? []) as PaymentRow[]).slice(0, 10));
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
  const selectedAmount = tierPrice(selectedTier);

  const showHowToPay = useMemo(() => {
    if (status === 'past_due' || status === 'paused' || status === 'cancelled') return true;
    if (status === 'trial' && trialDays <= 7) return true;
    if (status === 'active' && daysUntilExpiry !== null && daysUntilExpiry <= 7) return true;
    if (selectedTier !== tier) return true;
    return false;
  }, [daysUntilExpiry, selectedTier, status, tier, trialDays]);

  const copyText = async (value: string) => {
    await Clipboard.setStringAsync(value);
    setCopiedToast(true);
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi! I've paid for my LastBag ${selectedTier} plan subscription (NPR ${selectedAmount}). Please activate my account.\nRestaurant: ${partner?.name ?? ''}`,
    );
    Linking.openURL(
      `whatsapp://send?phone=${MANUAL_BILLING.whatsappPhone}&text=${message}`,
    ).catch(() =>
      Linking.openURL(`https://wa.me/${MANUAL_BILLING.whatsappPhone}?text=${message}`),
    );
  };

  const openEmail = () => {
    const subject = encodeURIComponent(
      `LastBag Subscription Payment - ${partner?.name ?? 'Partner'}`,
    );
    const body = encodeURIComponent(
      `Hi LastBag team,\n\nI have paid for my ${selectedTier} plan subscription (NPR ${selectedAmount}).\n\nPlease find the payment screenshot attached.\n\nRestaurant: ${partner?.name ?? ''}\nPhone: ${partner?.phone ?? ''}`,
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
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/partner/profile'))}
            style={styles.backBtn}
            hitSlop={8}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Subscription & Billing</Text>
          <Text style={styles.headerSubtitle}>Manage your LastBag plan</Text>
        </View>

        <CurrentPlanCard
          tier={tier}
          status={status}
          trialDays={trialDays}
          daysUntilExpiry={daysUntilExpiry}
          expiryIso={expiryIso}
        />

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

        {showHowToPay ? (
          <HowToPaySection
            selectedTier={selectedTier}
            selectedAmount={selectedAmount}
            onCopy={copyText}
            onWhatsApp={openWhatsApp}
            onEmail={openEmail}
          />
        ) : null}

        <Text style={styles.sectionLabel}>PAYMENT HISTORY</Text>
        <View style={styles.historyWrap}>
          {payments.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryTitle}>No payment history yet</Text>
              <Text style={styles.emptyHistoryBody}>Your payments will appear here</Text>
            </View>
          ) : (
            payments.map((payment) => <PaymentHistoryRow key={payment.id} payment={payment} />)
          )}
        </View>
      </ScrollView>

      <SuccessToast
        visible={copiedToast}
        title="Copied!"
        onHide={() => setCopiedToast(false)}
        durationMs={1600}
      />
    </View>
  );
}

function CurrentPlanCard({
  tier,
  status,
  trialDays,
  daysUntilExpiry,
  expiryIso,
}: {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trialDays: number;
  daysUntilExpiry: number | null;
  expiryIso: string | null;
}) {
  const badge = tierBadgeStyle(tier);
  const price = tierPrice(tier);

  let banner: { bg: string; border: string; title: string; titleColor: string; sub: string; subColor: string };

  const expired =
    status === 'past_due' ||
    status === 'paused' ||
    status === 'cancelled' ||
    (daysUntilExpiry !== null && daysUntilExpiry < 0 && status !== 'trial');

  const expiringSoon =
    status === 'active' && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry < 7;

  if (expired) {
    banner = {
      bg: '#FEE2E2',
      border: '#FECACA',
      title: '🚫 Subscription expired',
      titleColor: '#991B1B',
      sub: 'Your bags are hidden from customers',
      subColor: '#991B1B',
    };
  } else if (expiringSoon) {
    banner = {
      bg: '#FEF3C7',
      border: '#FDE68A',
      title: `⚠️ Expiring in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
      titleColor: '#92400E',
      sub: 'Renew now to keep your listings live',
      subColor: '#92400E',
    };
  } else if (status === 'trial') {
    banner = {
      bg: '#ECFDF5',
      border: '#6EE7B7',
      title: '✨ Free trial active',
      titleColor: '#065F46',
      sub: `${trialDays} day${trialDays === 1 ? '' : 's'} remaining`,
      subColor: '#059669',
    };
  } else {
    banner = {
      bg: '#ECFDF5',
      border: '#6EE7B7',
      title: '✅ Subscription active',
      titleColor: '#065F46',
      sub: `Expires ${formatSubscriptionDate(expiryIso)}`,
      subColor: '#6B7280',
    };
  }

  const renewalLabel = status === 'trial' ? 'Trial ends' : 'Next renewal';
  const renewalValue =
    status === 'trial'
      ? formatSubscriptionDate(expiryIso)
      : formatSubscriptionDate(expiryIso);

  return (
    <View style={styles.planCard}>
      <View style={[styles.statusBanner, { backgroundColor: banner.bg, borderColor: banner.border }]}>
        <Text style={[styles.statusTitle, { color: banner.titleColor }]}>{banner.title}</Text>
        <Text style={[styles.statusSub, { color: banner.subColor }]}>{banner.sub}</Text>
      </View>

      <View style={styles.detailRows}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current plan</Text>
          <View style={[styles.tierBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.tierBadgeText, { color: badge.text }]}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly price</Text>
          <Text style={styles.priceAmount}>NPR {price.toLocaleString('en-NP')}/month</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{renewalLabel}</Text>
          <Text style={styles.detailValue}>{renewalValue}</Text>
        </View>
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
  const price = tierPrice(tier);
  const highlighted = isCurrent || selected;

  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.optionCard,
        highlighted ? styles.optionCardCurrent : styles.optionCardOther,
        meta.popular ? { marginTop: 14 } : null,
      ]}>
      {meta.popular ? (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most popular</Text>
        </View>
      ) : null}

      <View style={styles.optionTop}>
        <Text style={styles.optionTitle}>{meta.title}</Text>
        <View style={styles.optionPriceWrap}>
          <Text style={styles.optionPrice}>NPR {price.toLocaleString('en-NP')}</Text>
          <Text style={styles.optionPriceUnit}>/mo</Text>
        </View>
      </View>

      {isCurrent ? (
        <View style={styles.currentPlanPill}>
          <Text style={styles.currentPlanPillText}>Current plan ✓</Text>
        </View>
      ) : null}

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

function HowToPaySection({
  selectedTier,
  selectedAmount,
  onCopy,
  onWhatsApp,
  onEmail,
}: {
  selectedTier: SubscriptionTier;
  selectedAmount: number;
  onCopy: (value: string) => void;
  onWhatsApp: () => void;
  onEmail: () => void;
}) {
  const openEsewa = () => {
    Linking.openURL('esewa://').catch(() =>
      Linking.openURL('https://play.google.com/store/apps/details?id=com.f1soft.esewa'),
    );
  };

  const openKhalti = () => {
    Linking.openURL('khalti://').catch(() =>
      Linking.openURL('https://play.google.com/store/apps/details?id=com.khalti'),
    );
  };

  return (
    <>
      <Text style={styles.sectionLabel}>HOW TO PAY</Text>
      <View style={styles.payCard}>
        <Text style={styles.payTitle}>Pay your subscription</Text>
        <Text style={styles.paySubtitle}>
          Send payment via any method below then WhatsApp us your screenshot
        </Text>

        <View style={styles.amountDueBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount due</Text>
            <Text style={styles.amountDueValue}>
              NPR {selectedAmount.toLocaleString('en-NP')}
            </Text>
          </View>
          <Text style={styles.amountDueMeta}>
            {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} · 1 month
          </Text>
        </View>

        {/* eSewa */}
        <View style={styles.methodCard}>
          <View style={styles.methodHeader}>
            <View style={[styles.methodIcon, { backgroundColor: '#60BB46' }]}>
              <Text style={styles.methodIconText}>e</Text>
            </View>
            <Text style={styles.methodTitle}>Pay via eSewa</Text>
            <View style={[styles.chip, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.chipText, { color: '#059669' }]}>Instant</Text>
            </View>
          </View>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>eSewa ID:</Text>
            <Text style={styles.idValue}>{MANUAL_BILLING.esewaId}</Text>
            <Pressable onPress={() => onCopy(MANUAL_BILLING.esewaId)} hitSlop={8}>
              <Text style={styles.copyBtn}>Copy</Text>
            </Pressable>
          </View>
          <View style={styles.qrBox}>
            <Image
              source={require('@/assets/images/esewa.jpeg')}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <Text style={styles.qrHint}>Scan QR in eSewa app</Text>
          </View>
          <Pressable onPress={openEsewa} style={[styles.methodCta, { backgroundColor: '#60BB46' }]}>
            <Text style={styles.methodCtaText}>Open eSewa app</Text>
          </Pressable>
        </View>

        {/* Khalti */}
        <View style={styles.methodCard}>
          <View style={styles.methodHeader}>
            <View style={[styles.methodIcon, { backgroundColor: '#5C2D91' }]}>
              <Text style={styles.methodIconText}>K</Text>
            </View>
            <Text style={styles.methodTitle}>Pay via Khalti</Text>
            <View style={[styles.chip, { backgroundColor: '#F5F0FF' }]}>
              <Text style={[styles.chipText, { color: '#5C2D91' }]}>Instant</Text>
            </View>
          </View>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>Khalti ID:</Text>
            <Text style={styles.idValue}>{MANUAL_BILLING.khaltiId}</Text>
            <Pressable onPress={() => onCopy(MANUAL_BILLING.khaltiId)} hitSlop={8}>
              <Text style={styles.copyBtn}>Copy</Text>
            </Pressable>
          </View>
          <View style={[styles.qrBox, { backgroundColor: '#F5F0FF' }]}>
            <Image
              source={require('@/assets/images/Khalti.jpeg')}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <Text style={styles.qrHint}>Scan QR in Khalti app</Text>
          </View>
          <Pressable onPress={openKhalti} style={[styles.methodCta, { backgroundColor: '#5C2D91' }]}>
            <Text style={styles.methodCtaText}>Open Khalti app</Text>
          </Pressable>
        </View>

        {/* Bank */}
        <View style={styles.methodCard}>
          <View style={styles.methodHeader}>
            <View style={[styles.methodIcon, { backgroundColor: '#1A1A1A' }]}>
              <Text style={styles.methodIconEmoji}>🏦</Text>
            </View>
            <Text style={styles.methodTitle}>Bank Transfer</Text>
            <View style={[styles.chip, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.chipText, { color: '#92400E' }]}>1-2 days</Text>
            </View>
          </View>
          <BankDetailRow label="Bank:" value={MANUAL_BILLING.bank.name} />
          <BankDetailRow label="Account name:" value={MANUAL_BILLING.bank.accountName} />
          <BankDetailRow
            label="Account number:"
            value={MANUAL_BILLING.bank.accountNumber}
            onCopy={() => onCopy(MANUAL_BILLING.bank.accountNumber)}
          />
          <BankDetailRow label="Branch:" value={MANUAL_BILLING.bank.branch} />
          <View style={styles.bankNote}>
            <Text style={styles.bankNoteText}>
              ⚠️ Use your restaurant name as the payment reference so we can identify your transfer
            </Text>
          </View>
        </View>

        <View style={styles.afterPayBox}>
          <Text style={styles.afterPayTitle}>After you pay:</Text>
          <Text style={styles.afterPayStep}>1. Take a screenshot of your payment</Text>
          <Text style={styles.afterPayStep}>2. WhatsApp it to {MANUAL_BILLING.esewaId}</Text>
          <Text style={styles.afterPayStep}>3. We&apos;ll activate your plan within 2 hours</Text>
        </View>

        <Pressable onPress={onWhatsApp} style={styles.whatsappBtn}>
          <Text style={styles.whatsappIcon}>💬</Text>
          <Text style={styles.whatsappText}>Send screenshot on WhatsApp</Text>
        </Pressable>

        <Pressable onPress={onEmail} style={styles.emailBtn}>
          <Text style={styles.emailText}>📧 Email payment screenshot</Text>
        </Pressable>
      </View>
    </>
  );
}

function BankDetailRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <View style={styles.bankRow}>
      <Text style={styles.idLabel}>{label}</Text>
      <Text style={[styles.idValue, { flex: 1 }]}>{value}</Text>
      {onCopy ? (
        <Pressable onPress={onCopy} hitSlop={8}>
          <Text style={styles.copyBtn}>Copy</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PaymentHistoryRow({ payment }: { payment: PaymentRow }) {
  const method = (payment.payment_method ?? '').toLowerCase();
  let iconBg = '#1A1A1A';
  let iconLabel = '💵';
  if (method.includes('esewa')) {
    iconBg = '#60BB46';
    iconLabel = 'e';
  } else if (method.includes('khalti')) {
    iconBg = '#5C2D91';
    iconLabel = 'K';
  } else if (method.includes('bank')) {
    iconLabel = '🏦';
  }

  const paid = payment.status === 'paid' || payment.status === 'completed';
  const pending = payment.status === 'pending';
  const months = monthsBetween(payment.period_start, payment.period_end);

  return (
    <View style={styles.historyRow}>
      <View style={[styles.historyIcon, { backgroundColor: iconBg }]}>
        <Text style={iconLabel.length === 1 ? styles.methodIconText : styles.methodIconEmoji}>
          {iconLabel}
        </Text>
      </View>
      <View style={styles.historyCenter}>
        <Text style={styles.historyAmount}>
          NPR {Number(payment.amount).toLocaleString('en-NP')}
        </Text>
        <Text style={styles.historyMeta}>
          {(payment.tier || 'plan').charAt(0).toUpperCase() + (payment.tier || 'plan').slice(1)} plan
          · {months} month{months === 1 ? '' : 's'}
        </Text>
        <Text style={styles.historyDate}>{formatSubscriptionDate(payment.created_at)}</Text>
      </View>
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
          {paid ? '✓ Paid' : pending ? '⏳ Pending' : '✗ Failed'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.background },
  loadingText: { color: Palette.textSecondary, fontWeight: '600' },
  header: {
    backgroundColor: '#D85A30',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  backChevron: { color: '#FFF', fontSize: 28, fontWeight: '600', marginTop: -2 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statusBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  statusTitle: { fontSize: 14, fontWeight: '600' },
  statusSub: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  detailRows: { marginTop: 16, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '600' },
  tierBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tierBadgeText: { fontSize: 12, fontWeight: '700' },
  priceAmount: { fontSize: 16, fontWeight: '700', color: '#D85A30' },
  sectionLabel: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#6B7280',
  },
  optionCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  optionCardCurrent: { borderColor: '#D85A30', backgroundColor: '#FAECE7' },
  optionCardOther: { borderColor: '#E5E7EB', backgroundColor: '#FFF' },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#D85A30',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  popularBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  optionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  optionPriceWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  optionPrice: { fontSize: 18, fontWeight: '700', color: '#D85A30' },
  optionPriceUnit: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  currentPlanPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#D85A30',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  currentPlanPillText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  featureList: { marginTop: 10, gap: 6 },
  featureText: { fontSize: 13, color: '#4B5563' },
  payCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
  },
  payTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  paySubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 20 },
  amountDueBox: {
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  amountDueValue: { fontSize: 20, fontWeight: '700', color: '#D85A30' },
  amountDueMeta: { fontSize: 12, color: '#6B7280', textAlign: 'right', marginTop: 4 },
  methodCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginTop: 12,
  },
  methodHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  methodIconEmoji: { fontSize: 16 },
  methodTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '700' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  idLabel: { fontSize: 13, color: '#6B7280' },
  idValue: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  copyBtn: { fontSize: 13, fontWeight: '700', color: '#D85A30' },
  qrBox: {
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    minHeight: 160,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  qrImage: { width: 140, height: 140 },
  qrHint: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  methodCta: {
    borderRadius: 999,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  methodCtaText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bankNote: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  bankNoteText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  afterPayBox: {
    backgroundColor: '#FAECE7',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  afterPayTitle: { fontSize: 13, fontWeight: '600', color: '#993C1D', marginBottom: 8 },
  afterPayStep: { fontSize: 13, color: '#374151', marginBottom: 6 },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: 999,
    height: 52,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  whatsappIcon: { fontSize: 18 },
  whatsappText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  emailBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0EDE8',
    borderRadius: 999,
    height: 44,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  historyWrap: { marginHorizontal: 16, marginBottom: 24 },
  emptyHistory: { paddingVertical: 20, alignItems: 'center' },
  emptyHistoryTitle: { fontSize: 13, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
  emptyHistoryBody: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },
  historyRow: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCenter: { flex: 1 },
  historyAmount: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  historyMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  historyDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusPaid: { backgroundColor: '#ECFDF5' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusFailed: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
});
