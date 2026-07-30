import { ShoppingBag, Star, Wallet } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

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
      accent: false,
    },
    {
      key: 'saved',
      value: moneySavedLabel,
      label: 'Money saved',
      icon: Wallet,
      accent: true,
    },
    {
      key: 'reviews',
      value: String(reviewsGiven),
      label: 'Reviews',
      icon: Star,
      accent: false,
    },
  ] as const;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerAccent} />
        <Text style={styles.eyebrow}>Your impact</Text>
      </View>

      <View style={styles.card}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <View
              key={stat.key}
              style={[styles.tile, stat.accent && styles.tileAccent]}>
              <View style={[styles.iconWrap, stat.accent && styles.iconWrapAccent]}>
                <Icon
                  size={14}
                  color={stat.accent ? Palette.primary : Palette.primaryDark}
                  strokeWidth={2.2}
                />
              </View>
              <Text
                style={[styles.value, stat.accent && styles.valueAccent]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}>
                {stat.value}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 2,
  },
  headerAccent: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
  eyebrow: {
    ...Type.caption,
    color: Palette.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  card: {
    ...CardChrome,
    borderRadius: 20,
    padding: Spacing.sm,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: Radius.lg,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  tileAccent: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapAccent: {
    backgroundColor: Palette.white,
    borderColor: Palette.overlay.border,
  },
  value: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  valueAccent: {
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
