import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { getTrialDaysRemaining } from '@/lib/subscriptions';
import type { PartnerSubscriptionFields } from '@/lib/subscriptions';
import type { SubscriptionStatus } from '@/constants/subscriptions';

const DISMISS_KEY = 'trial_banner_dismissed_until';

type TrialBannerProps = {
  partner: PartnerSubscriptionFields & { id?: string; trial_ends_at?: string | null };
};

export function TrialBanner({ partner }: TrialBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const status = (partner.subscription_status ?? 'trial') as SubscriptionStatus;
  const daysLeft = getTrialDaysRemaining(partner.trial_ends_at);

  useEffect(() => {
    void (async () => {
      if (status !== 'trial' || daysLeft <= 7) return;
      const until = await AsyncStorage.getItem(DISMISS_KEY);
      if (until && Date.now() < Number(until)) {
        setDismissed(true);
      }
    })();
  }, [daysLeft, status]);

  const dismissForToday = async () => {
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    await AsyncStorage.setItem(DISMISS_KEY, String(tomorrow.getTime()));
    setDismissed(true);
  };

  if (status === 'trial' && daysLeft > 7 && !dismissed) {
    return (
      <View style={[styles.banner, styles.bannerTrial]}>
        <View style={styles.copy}>
          <Text style={styles.title}>{daysLeft} days left in your free trial</Text>
          <Pressable onPress={() => router.push('/(tabs)/partner/subscription')}>
            <Text style={styles.link}>Learn more</Text>
          </Pressable>
        </View>
        <Pressable onPress={dismissForToday} hitSlop={8}>
          <Text style={styles.dismiss}>✕</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'trial' && daysLeft <= 7) {
    return (
      <View style={[styles.banner, styles.bannerWarning]}>
        <Text style={styles.titleDark}>
          Your trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'} — add a payment method to
          keep your bags live
        </Text>
        <Button
          label="Add payment"
          size="md"
          onPress={() => router.push('/(tabs)/partner/subscription')}
          style={styles.cta}
        />
      </View>
    );
  }

  if (status === 'past_due' || status === 'paused') {
    return (
      <View style={[styles.banner, styles.bannerDanger]}>
        <Text style={styles.titleLight}>
          Your subscription has lapsed — your listings are hidden from customers
        </Text>
        <Button
          label="Reactivate"
          size="md"
          onPress={() => router.push('/partner/reactivate')}
          style={styles.cta}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  bannerTrial: {
    backgroundColor: Palette.lightGreenBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerWarning: {
    backgroundColor: Palette.amber + '22',
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  bannerDanger: {
    backgroundColor: '#FAECE7',
    borderWidth: 1,
    borderColor: '#E24B4A',
  },
  copy: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  titleDark: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: '#854F0B',
  },
  titleLight: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: '#993C1D',
  },
  link: {
    ...Type.caption,
    color: Palette.primary,
    fontWeight: '700',
  },
  dismiss: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
    fontWeight: '700',
    paddingHorizontal: Spacing.xs,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xl,
  },
});
