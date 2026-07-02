import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TIER_SIGNUP_OPTIONS, type SubscriptionTier } from '@/constants/subscriptions';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type SubscriptionTierPickerProps = {
  value: SubscriptionTier | null;
  onChange: (tier: SubscriptionTier, avgDailyMeals: number) => void;
  error?: string;
};

export function SubscriptionTierPicker({ value, onChange, error }: SubscriptionTierPickerProps) {
  return (
    <View style={styles.wrap}>
      {TIER_SIGNUP_OPTIONS.map((option) => {
        const selected = value === option.tier;
        return (
          <Pressable
            key={option.tier}
            onPress={() => {
              void hapticButtonPress();
              onChange(option.tier, option.avgDailyMeals);
            }}
            style={[styles.card, selected && styles.cardSelected, error && !selected && styles.cardError]}>
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>{option.title}</Text>
              <Text style={[styles.cardPrice, selected && styles.cardPriceSelected]}>{option.priceLabel}</Text>
            </View>
            <Text style={[styles.cardMeals, selected && styles.cardMealsSelected]}>{option.mealsLabel}</Text>
          </Pressable>
        );
      })}
      <Text style={styles.caption}>
        Free for your first 30 days — cancel anytime, no card required to start
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: Border.width,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  cardSelected: {
    borderColor: Palette.primary,
    backgroundColor: Palette.lightGreenBg,
  },
  cardError: {
    borderColor: Palette.dangerBorder,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  cardTitleSelected: {
    color: Palette.primaryDark,
  },
  cardPrice: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  cardPriceSelected: {
    color: Palette.primaryDark,
  },
  cardMeals: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  cardMealsSelected: {
    color: Palette.primaryDark,
    fontWeight: '600',
  },
  caption: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  error: {
    ...Type.caption,
    color: Palette.dangerText,
    textAlign: 'center',
  },
});
