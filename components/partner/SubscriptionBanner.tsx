import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import type { SubscriptionStatus } from '@/constants/subscriptions';
import {
  getDaysUntil,
  getSubscriptionExpiryIso,
  getTrialDaysRemaining,
  type PartnerSubscriptionFields,
} from '@/lib/subscriptions';
import { hapticButtonPress } from '@/lib/haptics';

const DISMISS_KEY = 'subscription_banner_dismissed_until';

type SubscriptionBannerProps = {
  partner: PartnerSubscriptionFields & { trial_ends_at?: string | null };
  placement?: 'inHeader' | 'overlap' | 'content';
};

export function SubscriptionBanner({ partner, placement = 'overlap' }: SubscriptionBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const status = (partner.subscription_status ?? 'trial') as SubscriptionStatus;
  const daysLeft = getTrialDaysRemaining(partner.trial_ends_at);
  const expiryIso = getSubscriptionExpiryIso(partner);
  const daysUntilExpiry = getDaysUntil(expiryIso);

  useEffect(() => {
    void (async () => {
      if (status !== 'trial' || daysLeft <= 7) return;
      const until = await AsyncStorage.getItem(DISMISS_KEY);
      if (until && Date.now() < Number(until)) setDismissed(true);
    })();
  }, [daysLeft, status]);

  const dismissForToday = async () => {
    void hapticButtonPress();
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    await AsyncStorage.setItem(DISMISS_KEY, String(tomorrow.getTime()));
    setDismissed(true);
  };

  const goBilling = () => router.push('/(tabs)/partner/subscription');

  if (status === 'active' && (daysUntilExpiry === null || daysUntilExpiry > 7)) {
    return null;
  }

  if (status === 'trial' && daysLeft > 7 && !dismissed) {
    if (placement === 'inHeader') {
      return (
        <View style={styles.headerBanner}>
          <Text style={styles.headerBannerEmoji}>✨</Text>
          <Text style={styles.headerBannerText}>{daysLeft} days free trial remaining</Text>
          <Pressable onPress={dismissForToday} hitSlop={8}>
            <Text style={styles.headerDismiss}>✕</Text>
          </Pressable>
        </View>
      );
    }

    if (placement === 'content') {
      return (
        <View style={styles.contentBanner}>
          <Text style={styles.contentBannerText}>{daysLeft} days left on your free trial</Text>
          <Pressable onPress={dismissForToday} hitSlop={8}>
            <Text style={styles.contentDismiss}>Dismiss</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  }

  if (placement !== 'overlap') return null;

  if (status === 'trial' && daysLeft <= 7) {
    return (
      <View style={styles.urgentBanner}>
        <Text style={styles.urgentEmoji}>⚠️</Text>
        <View style={styles.urgentCopy}>
          <Text style={styles.urgentTitle}>
            Your free trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
          </Text>
          <Text style={styles.urgentSubtitle}>Renew now to keep your listings live</Text>
        </View>
        <Pressable onPress={goBilling} hitSlop={8}>
          <Text style={styles.urgentAction}>Renew →</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'active' && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry < 7) {
    return (
      <View style={styles.urgentBanner}>
        <Text style={styles.urgentEmoji}>⚠️</Text>
        <View style={styles.urgentCopy}>
          <Text style={styles.urgentTitle}>
            Subscription expires in {daysUntilExpiry}{' '}
            {daysUntilExpiry === 1 ? 'day' : 'days'}
          </Text>
          <Text style={styles.urgentSubtitle}>Renew now to keep your listings live</Text>
        </View>
        <Pressable onPress={goBilling} hitSlop={8}>
          <Text style={styles.urgentAction}>Renew →</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'past_due' || status === 'paused' || status === 'cancelled') {
    return (
      <View style={[styles.urgentBanner, styles.pastDueBanner]}>
        <Text style={styles.urgentEmoji}>🚫</Text>
        <View style={styles.urgentCopy}>
          <Text style={[styles.urgentTitle, styles.pastDueTitle]}>Subscription expired</Text>
          <Text style={[styles.urgentSubtitle, styles.pastDueSubtitle]}>
            Your bags are hidden from customers
          </Text>
        </View>
        <Pressable onPress={goBilling} hitSlop={8}>
          <Text style={[styles.urgentAction, styles.pastDueAction]}>Renew now →</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    width: '100%',
  },
  headerBannerEmoji: { fontSize: 14 },
  headerBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  headerDismiss: { fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: '400' },
  contentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contentBannerText: {
    flex: 1,
    fontSize: 13,
    color: Palette.primaryDark,
    fontWeight: '600',
  },
  contentDismiss: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontWeight: '500',
    marginLeft: 12,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  pastDueBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  urgentEmoji: { fontSize: 16 },
  urgentCopy: { flex: 1, gap: 2 },
  urgentTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  urgentSubtitle: { fontSize: 12, color: '#B45309' },
  pastDueTitle: { color: '#991B1B' },
  pastDueSubtitle: { color: '#B91C1C' },
  urgentAction: { fontSize: 14, fontWeight: '700', color: Palette.primary },
  pastDueAction: { color: '#DC2626' },
});
