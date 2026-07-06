import { useRouter } from 'expo-router';
import { AlertTriangle, Check, ChevronRight, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DEFAULT_TIER_PRICING } from '@/constants/subscriptions';
import { Palette } from '@/constants/Colors';
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';
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
      <Pressable onPress={navigate} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
        <View style={[styles.card, styles.pastDue]}>
          <View style={[styles.iconWrap, styles.iconWrapDanger]}>
            <AlertTriangle size={18} color={Palette.dangerText} strokeWidth={2} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.titleDanger}>Payment overdue</Text>
            <Text style={styles.subDanger}>Your listings are hidden until resolved</Text>
          </View>
          <ChevronRight size={16} color={Palette.dangerText} strokeWidth={2.5} />
        </View>
      </Pressable>
    );
  }

  if (status === 'active') {
    return (
      <Pressable onPress={navigate} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
        <View style={[styles.card, styles.active]}>
          <View style={[styles.iconWrap, styles.iconWrapSuccess]}>
            <Check size={18} color={Palette.success} strokeWidth={2.5} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.titleSuccess}>Active — {tierLabel}</Text>
            <Text style={styles.subSuccess}>
              Renews {formatSubscriptionDate(partner.current_period_end)}
            </Text>
          </View>
          <ChevronRight size={16} color={Palette.success} strokeWidth={2.5} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={navigate} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View style={[styles.card, styles.trial]}>
        <View style={[styles.iconWrap, styles.iconWrapTrial]}>
          <Sparkles size={18} color={Palette.primary} strokeWidth={2} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.titleTrial}>Free trial</Text>
          <Text style={styles.subTrial}>
            {daysLeft > 0 ? `${daysLeft} days remaining` : 'Trial ending soon'}
          </Text>
        </View>
        <ChevronRight size={16} color={Palette.primary} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  trial: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
  },
  active: {
    backgroundColor: Palette.successBg,
    borderColor: '#BBF7D0',
  },
  pastDue: {
    backgroundColor: Palette.dangerSoft,
    borderColor: Palette.dangerBorder,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapTrial: {
    backgroundColor: Palette.white,
  },
  iconWrapSuccess: {
    backgroundColor: Palette.white,
  },
  iconWrapDanger: {
    backgroundColor: Palette.white,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  titleTrial: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
  subTrial: {
    ...Type.label,
    color: Palette.textSecondary,
  },
  titleSuccess: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.success,
  },
  subSuccess: {
    ...Type.label,
    color: Palette.textSecondary,
  },
  titleDanger: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.dangerText,
  },
  subDanger: {
    ...Type.label,
    color: Palette.dangerText,
  },
});
