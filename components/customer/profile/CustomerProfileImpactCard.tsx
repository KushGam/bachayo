import { ShoppingBag, Star, Wallet } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, Spacing, Type } from '@/constants/theme';

type CustomerProfileImpactCardProps = {
  bagsRescued: number;
  moneySavedLabel: string;
  reviewsGiven: number;
};

export function CustomerProfileImpactCard({
  bagsRescued,
  moneySavedLabel,
  reviewsGiven,
}: CustomerProfileImpactCardProps) {
  const stats = [
    {
      key: 'bags',
      value: String(bagsRescued),
      label: 'Bags rescued',
      icon: ShoppingBag,
    },
    {
      key: 'saved',
      value: moneySavedLabel,
      label: 'Money saved',
      icon: Wallet,
      highlight: true,
    },
    {
      key: 'reviews',
      value: String(reviewsGiven),
      label: 'Reviews',
      icon: Star,
    },
  ] as const;

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Your impact</Text>
      <View style={styles.card}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const highlight = 'highlight' in stat && stat.highlight;
          return (
            <View key={stat.key} style={styles.tile}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.tileInner}>
                <Icon
                  size={15}
                  color={highlight ? Palette.primary : Palette.textSecondary}
                  strokeWidth={2.2}
                />
                <Text
                  style={[styles.value, highlight && styles.valueHighlight]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}>
                  {stat.value}
                </Text>
                <Text style={styles.label}>{stat.label}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  eyebrow: {
    ...Type.label,
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
    marginLeft: 4,
  },
  card: {
    ...CardChrome,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: Spacing.md + 2,
    backgroundColor: Palette.surface,
  },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: Palette.border,
    marginVertical: 4,
  },
  tileInner: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginTop: 2,
  },
  valueHighlight: {
    color: Palette.primary,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    color: Palette.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
