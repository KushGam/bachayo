import {
  CheckCircle2,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatNprFromPaisa } from '@/lib/partnerBags';

export type DashboardStat = {
  label: string;
  value: string;
  valueColor?: string;
};

type DashboardStatsRowProps = {
  stats: DashboardStat[];
};

const STAT_CONFIG = [
  { label: 'Bags', Icon: Package },
  { label: 'Reserved', Icon: ShoppingBag },
  { label: 'Picked', Icon: CheckCircle2 },
  { label: 'Est. Revenue', Icon: TrendingUp },
] as const;

export function DashboardStatsRow({ stats }: DashboardStatsRowProps) {
  return (
    <View style={styles.card}>
      {STAT_CONFIG.map((config, index) => {
        const stat = stats.find((row) => row.label === config.label) ?? {
          label: config.label,
          value: '0',
        };
        const isRevenue = config.label === 'Est. Revenue';
        const Icon = config.Icon;

        return (
          <View key={config.label} style={styles.cellWrap}>
            <View style={styles.cell}>
              <View style={[styles.iconWrap, isRevenue && styles.iconWrapRevenue]}>
                <Icon
                  size={14}
                  color={isRevenue ? Palette.primary : Palette.textSecondary}
                  strokeWidth={2.2}
                />
              </View>
              <Text
                style={[
                  styles.value,
                  isRevenue && stat.valueColor ? { color: stat.valueColor } : null,
                  isRevenue && styles.valueRevenue,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}>
                {stat.value}
              </Text>
              <Text style={styles.label}>{stat.label}</Text>
            </View>
            {index < STAT_CONFIG.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        );
      })}
    </View>
  );
}

export function buildDashboardStats(input: {
  bagsListed: number;
  reserved: number;
  pickedUp: number;
  revenue: number;
  yesterday?: { bagsListed: number; reserved: number; pickedUp: number; revenue: number };
}): DashboardStat[] {
  const revenueNpr = input.revenue / 100;

  return [
    { label: 'Bags', value: String(input.bagsListed) },
    { label: 'Reserved', value: String(input.reserved) },
    { label: 'Picked', value: String(input.pickedUp) },
    {
      label: 'Est. Revenue',
      value: revenueNpr > 0 ? formatNprFromPaisa(input.revenue) : '₨ 0',
      valueColor: revenueNpr > 0 ? Palette.primary : Palette.textTertiary,
    },
  ];
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    ...CardChrome,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    ...FloatingShadow,
  },
  cellWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapRevenue: {
    backgroundColor: Palette.primaryLight,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  valueRevenue: {
    fontSize: 15,
  },
  label: {
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'center',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: Palette.borderSubtle,
  },
});
