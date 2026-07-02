import { StyleSheet, Text, View } from 'react-native';

import { SUBSCRIPTION_BADGE_COLORS, type SubscriptionStatus } from '@/constants/subscriptions';
import { Radius, Type } from '@/constants/theme';
import { getStatusLabel } from '@/lib/subscriptions';

type SubscriptionStatusBadgeProps = {
  status: SubscriptionStatus;
};

export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  const colors = SUBSCRIPTION_BADGE_COLORS[status] ?? SUBSCRIPTION_BADGE_COLORS.paused;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{getStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  text: {
    ...Type.label,
    fontWeight: '700',
  },
});
