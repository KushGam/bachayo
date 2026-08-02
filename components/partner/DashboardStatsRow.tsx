import {
  CheckCircle2,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Spacing, Type } from '@/constants/theme';
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
  { label: 'Bags', Icon: Package, hint: 'Listed today' },
  { label: 'Reserved', Icon: ShoppingBag, hint: 'Awaiting pickup' },
  { label: 'Picked', Icon: CheckCircle2, hint: 'Handed over' },
  { label: 'Earned', Icon: TrendingUp, hint: 'From pickups' },
] as const;

export function DashboardStatsRow({ stats }: DashboardStatsRowProps) {
  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        {STAT_CONFIG.map((config, index) => {
          const stat = stats.find((row) => row.label === config.label) ?? {
            label: config.label,
            value: '0',
          };
          const isEarned = config.label === 'Earned';
          const Icon = config.Icon;
          const isRight = index % 2 === 1;
          const isBottom = index >= 2;

          return (
            <View
              key={config.label}
              style={[
                styles.cell,
                isRight && styles.cellRight,
                isBottom && styles.cellBottom,
                isEarned && styles.cellEarned,
              ]}>
              <View style={styles.cellTop}>
                <View style={[styles.iconWrap, isEarned && styles.iconWrapEarned]}>
                  <Icon
                    size={14}
                    color={isEarned ? Palette.primary : Palette.textSecondary}
                    strokeWidth={2.2}
                  />
                </View>
                <Text style={styles.hint} numberOfLines={1}>
                  {config.hint}
                </Text>
              </View>
              <Text
                style={[
                  styles.value,
                  isEarned && styles.valueEarned,
                  isEarned && stat.valueColor ? { color: stat.valueColor } : null,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}>
                {stat.value}
              </Text>
              <Text style={[styles.label, isEarned && styles.labelEarned]}>
                {stat.label}
              </Text>
            </View>
          );
        })}
      </View>
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
      label: 'Earned',
      value: revenueNpr > 0 ? formatNprFromPaisa(input.revenue) : 'Rs 0',
      valueColor: revenueNpr > 0 ? Palette.primary : Palette.textTertiary,
    },
  ];
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    borderRadius: 20,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
    gap: 3,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  cellRight: {
    borderRightWidth: 0,
  },
  cellBottom: {
    borderBottomWidth: 0,
  },
  cellEarned: {
    backgroundColor: Palette.primaryLight,
  },
  cellTop: {
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
  iconWrapEarned: {
    backgroundColor: Palette.white,
    borderColor: Palette.overlay.border,
  },
  hint: {
    ...Type.label,
    flex: 1,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  valueEarned: {
    fontSize: 20,
    lineHeight: 24,
    color: Palette.primary,
  },
  label: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  labelEarned: {
    color: Palette.primaryDark,
  },
});
