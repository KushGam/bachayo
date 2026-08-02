import { Leaf, ShoppingBag, Star, TrendingUp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatFoodRescued, formatRatingDisplay } from '@/lib/partnerProfile';

type PartnerProfileStatsCardProps = {
  bagsSold: number;
  revenueLabel: string;
  rating: number | null;
  reviewCount?: number;
  foodRescuedKg: number;
  tierLabel: string;
  statusLabel: string;
};

const STAT_CONFIG = [
  { key: 'bags', label: 'Bags sold', icon: ShoppingBag },
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'rating', label: 'Avg rating', icon: Star },
  { key: 'food', label: 'Food rescued', icon: Leaf },
] as const;

export function PartnerProfileStatsCard({
  bagsSold,
  revenueLabel,
  rating,
  reviewCount = 0,
  foodRescuedKg,
  tierLabel,
  statusLabel,
}: PartnerProfileStatsCardProps) {
  const values: Record<(typeof STAT_CONFIG)[number]['key'], string> = {
    bags: String(bagsSold),
    revenue: revenueLabel,
    rating: formatRatingDisplay(rating, reviewCount),
    food: formatFoodRescued(foodRescuedKg),
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>Performance</Text>
        <View style={styles.planPill}>
          <Text style={styles.planText}>
            {tierLabel} · {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.grid}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 2,
  },
  eyebrow: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  planPill: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...FloatingShadow,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    minHeight: 84,
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  label: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
});
