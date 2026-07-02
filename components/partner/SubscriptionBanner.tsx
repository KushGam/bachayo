import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import type { SubscriptionStatus } from '@/constants/subscriptions';
import { getTrialDaysRemaining, type PartnerSubscriptionFields } from '@/lib/subscriptions';
import { hapticButtonPress } from '@/lib/haptics';

const DISMISS_KEY = 'subscription_banner_dismissed_until';

type SubscriptionBannerProps = {
  partner: PartnerSubscriptionFields & { trial_ends_at?: string | null };
  placement?: 'inHeader' | 'overlap';
};

export function SubscriptionBanner({ partner, placement = 'overlap' }: SubscriptionBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const status = (partner.subscription_status ?? 'trial') as SubscriptionStatus;
  const daysLeft = getTrialDaysRemaining(partner.trial_ends_at);

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

  if (status === 'active') return null;

  if (status === 'trial' && daysLeft > 7 && !dismissed) {
    if (placement !== 'inHeader') return null;

    return (
      <View style={styles.headerBanner}>
        <Text style={styles.headerBannerEmoji}>✨</Text>
        <Text style={styles.headerBannerText}>
          {daysLeft} days free trial remaining
        </Text>
        <Pressable onPress={dismissForToday} hitSlop={8}>
          <Text style={styles.headerDismiss}>✕</Text>
        </Pressable>
      </View>
    );
  }

  if (placement !== 'overlap') return null;

  if (status === 'trial' && daysLeft <= 7) {
    return (
      <View style={styles.urgentBanner}>
        <Text style={styles.urgentEmoji}>⚠️</Text>
        <View style={styles.urgentCopy}>
          <Text style={styles.urgentTitle}>
            Trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
          </Text>
          <Text style={styles.urgentSubtitle}>Add payment to keep your listings live</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/partner/subscription')}
          hitSlop={8}>
          <Text style={styles.urgentAction}>Add →</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'past_due' || status === 'paused') {
    return (
      <View style={[styles.urgentBanner, styles.pastDueBanner]}>
        <Text style={styles.urgentEmoji}>⚠️</Text>
        <View style={styles.urgentCopy}>
          <Text style={[styles.urgentTitle, styles.pastDueTitle]}>Your listings are hidden</Text>
          <Text style={[styles.urgentSubtitle, styles.pastDueSubtitle]}>
            Reactivate to show bags to customers again
          </Text>
        </View>
        <Pressable onPress={() => router.push('/partner/reactivate')} hitSlop={8}>
          <Text style={[styles.urgentAction, styles.pastDueAction]}>Reactivate now →</Text>
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
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 14,
    width: '100%',
  },
  headerBannerEmoji: {
    fontSize: 16,
  },
  headerBannerText: {
    flex: 1,
    fontSize: 13,
    color: Palette.white,
    fontWeight: '500',
  },
  headerDismiss: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -16,
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
  },
  urgentEmoji: {
    fontSize: 16,
  },
  urgentCopy: {
    flex: 1,
    gap: 2,
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  urgentSubtitle: {
    fontSize: 12,
    color: '#B45309',
  },
  pastDueTitle: {
    color: '#991B1B',
  },
  pastDueSubtitle: {
    color: '#B91C1C',
  },
  urgentAction: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.primary,
  },
  pastDueAction: {
    color: '#DC2626',
  },
});
