import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DEFAULT_TIER_PRICING } from '@/constants/subscriptions';
import { Palette } from '@/constants/Colors';
import type { PartnerSubscriptionFields } from '@/lib/subscriptions';
import {
  formatSubscriptionDate,
  getTrialDaysRemaining,
  type SubscriptionStatus,
} from '@/lib/subscriptions';

type SubscriptionStatusCardProps = {
  partner: PartnerSubscriptionFields;
};

export function SubscriptionStatusCard({ partner }: SubscriptionStatusCardProps) {
  const router = useRouter();
  const status = (partner.subscription_status ?? 'trial') as SubscriptionStatus;
  const tierLabel =
    partner.subscription_tier && DEFAULT_TIER_PRICING[partner.subscription_tier]
      ? DEFAULT_TIER_PRICING[partner.subscription_tier].label.split('—')[0].trim()
      : 'Small';

  const daysLeft = getTrialDaysRemaining(partner.trial_ends_at);
  const navigate = () => router.push('/(tabs)/partner/subscription');

  if (status === 'past_due') {
    return (
      <Pressable onPress={navigate} style={[styles.card, styles.pastDue]}>
        <Text style={styles.emoji}>⚠️</Text>
        <View style={styles.copy}>
          <Text style={styles.titlePastDue}>Payment overdue</Text>
          <Text style={styles.subPastDue}>Listings are hidden</Text>
        </View>
        <Text style={styles.actionPastDue}>Fix now →</Text>
      </Pressable>
    );
  }

  if (status === 'active') {
    return (
      <Pressable onPress={navigate} style={[styles.card, styles.active]}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.titleActive}>Active — {tierLabel} plan</Text>
          <Text style={styles.subActive}>
            Renews {formatSubscriptionDate(partner.current_period_end)}
          </Text>
        </View>
        <Text style={styles.actionPrimary}>Manage →</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={navigate} style={[styles.card, styles.trial]}>
      <Text style={styles.emoji}>✨</Text>
      <View style={styles.copy}>
        <Text style={styles.titleTrial}>Free trial</Text>
        <Text style={styles.subTrial}>
          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Trial ending soon'}
        </Text>
      </View>
      <Text style={styles.actionPrimary}>Upgrade →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  trial: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  active: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  pastDue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  emoji: {
    fontSize: 16,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  titleTrial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  subTrial: {
    fontSize: 12,
    color: '#059669',
  },
  titleActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  subActive: {
    fontSize: 12,
    color: '#059669',
  },
  titlePastDue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
  },
  subPastDue: {
    fontSize: 12,
    color: '#DC2626',
  },
  actionPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primary,
  },
  actionPastDue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
});
