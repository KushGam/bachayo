import { ShoppingBag, Star, Wallet } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

type CustomerProfileImpactCardProps = {
  bagsRescued: number;
  moneySavedLabel: string;
  reviewsGiven: number;
};

const STAT_CONFIG = [
  { key: 'bags', label: 'Bags rescued', icon: ShoppingBag },
  { key: 'saved', label: 'Money saved', icon: Wallet },
  { key: 'reviews', label: 'Reviews', icon: Star },
] as const;

export function CustomerProfileImpactCard({
  bagsRescued,
  moneySavedLabel,
  reviewsGiven,
}: CustomerProfileImpactCardProps) {
  const values: Record<(typeof STAT_CONFIG)[number]['key'], string> = {
    bags: String(bagsRescued),
    saved: moneySavedLabel,
    reviews: String(reviewsGiven),
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Your impact</Text>
      <View style={styles.card}>
        {STAT_CONFIG.map((stat) => {
          const Icon = stat.icon;
          return (
            <View key={stat.key} style={styles.tile}>
              <View style={styles.iconWrap}>
                <Icon size={15} color={Palette.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {values[stat.key]}
              </Text>
              <Text style={styles.label}>{stat.label}</Text>
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
    color: Palette.textSecondary,
    fontWeight: '600',
    marginLeft: 2,
  },
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    ...FloatingShadow,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.primaryDark,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  label: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
