import { Platform, StyleSheet, Text, View } from 'react-native';

import { formatNprFromPaisa } from '@/lib/partnerBags';

export type DashboardStat = {
  label: string;
  value: string;
  valueColor?: string;
};

type DashboardStatsRowProps = {
  stats: DashboardStat[];
};

const STAT_LABELS = ['Bags', 'Reserved', 'Picked', 'Est. Revenue'] as const;

export function DashboardStatsRow({ stats }: DashboardStatsRowProps) {
  const ordered = STAT_LABELS.map(
    (label) => stats.find((stat) => stat.label === label) ?? { label, value: '0' },
  );

  return (
    <View style={styles.card}>
      {ordered.map((stat, index) => (
        <View key={stat.label} style={styles.cellWrap}>
          <StatCell stat={stat} isRevenue={stat.label === 'Est. Revenue'} />
          {index < ordered.length - 1 ? <View style={styles.verticalDivider} /> : null}
        </View>
      ))}
    </View>
  );
}

function StatCell({ stat, isRevenue }: { stat: DashboardStat; isRevenue: boolean }) {
  const revenueColor = stat.valueColor ?? (isRevenue ? '#D85A30' : undefined);

  return (
    <View style={styles.cell}>
      <Text
        style={[
          styles.value,
          isRevenue && revenueColor ? { color: revenueColor } : null,
        ]}>
        {stat.value}
      </Text>
      <Text style={styles.label}>{stat.label}</Text>
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
      valueColor: revenueNpr > 0 ? '#D85A30' : '#9CA3AF',
    },
  ];
}

const styles = StyleSheet.create({
  card: {
    marginTop: -1,
    marginHorizontal: 0,
    backgroundColor: '#242424',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  cellWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 3,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
