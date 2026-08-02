import { Package, ShoppingBag, TrendingUp, Wallet } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Spacing, Type } from '@/constants/theme';
import { computeTodaySummary, formatNprFromPaisa, type PartnerBagWithStats } from '@/lib/partnerBags';

export function TodaySummaryCard({ bags }: { bags: PartnerBagWithStats[] }) {
  const summary = computeTodaySummary(bags);
  const stats = [
    {
      value: String(summary.listed),
      label: 'Listed',
      hint: 'Live now',
      icon: Package,
    },
    {
      value: String(summary.reserved),
      label: 'Waiting',
      hint: 'Awaiting pickup',
      icon: ShoppingBag,
    },
    {
      value: formatNprFromPaisa(summary.potentialRevenue),
      label: 'Pipeline',
      hint: 'Not picked yet',
      icon: TrendingUp,
    },
    {
      value: formatNprFromPaisa(summary.earned),
      label: 'Earned',
      hint: 'From pickups',
      icon: Wallet,
      accent: true,
    },
  ] as const;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>Today</Text>
        <Text style={styles.title}>Snapshot</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.grid}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const accent = 'accent' in stat && stat.accent;
            const isRight = index % 2 === 1;
            const isBottom = index >= 2;
            return (
              <View
                key={stat.label}
                style={[
                  styles.tile,
                  isRight && styles.tileRight,
                  isBottom && styles.tileBottom,
                  accent && styles.tileAccent,
                ]}>
                <View style={styles.tileTop}>
                  <View style={[styles.iconWrap, accent && styles.iconWrapAccent]}>
                    <Icon
                      size={14}
                      color={accent ? Palette.primary : Palette.textSecondary}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text style={styles.hint} numberOfLines={1}>
                    {stat.hint}
                  </Text>
                </View>
                <Text
                  style={[styles.value, accent && styles.valueAccent]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}>
                  {stat.value}
                </Text>
                <Text style={[styles.label, accent && styles.labelAccent]}>{stat.label}</Text>
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
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 2,
  },
  eyebrow: {
    ...Type.label,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Palette.textTertiary,
  },
  title: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  card: {
    ...CardChrome,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    width: '50%',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
    gap: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  tileRight: {
    borderRightWidth: 0,
  },
  tileBottom: {
    borderBottomWidth: 0,
  },
  tileAccent: {
    backgroundColor: Palette.primaryLight,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapAccent: {
    backgroundColor: Palette.white,
    borderColor: Palette.overlay.border,
  },
  hint: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
  },
  valueAccent: {
    color: Palette.primary,
  },
  label: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  labelAccent: {
    color: Palette.primaryDark,
  },
});
