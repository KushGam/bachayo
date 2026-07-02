import { Platform, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { formatRsPaisa } from '@/lib/helpers';

export type DashboardStat = {
  label: string;
  value: string;
};

type DashboardStatsRowProps = {
  stats: DashboardStat[];
};

const STAT_LABELS = ['Bags Listed', 'Reserved', 'Picked Up', 'Revenue'] as const;

export function DashboardStatsRow({ stats }: DashboardStatsRowProps) {
  const ordered = STAT_LABELS.map((label) => stats.find((stat) => stat.label === label) ?? { label, value: '0' });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <StatCell stat={ordered[0]} />
        <View style={styles.verticalDivider} />
        <StatCell stat={ordered[1]} />
      </View>
      <View style={styles.horizontalDivider} />
      <View style={styles.row}>
        <StatCell stat={ordered[2]} />
        <View style={styles.verticalDivider} />
        <StatCell stat={ordered[3]} />
      </View>
    </View>
  );
}

function StatCell({ stat }: { stat: DashboardStat }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.value}>{stat.value}</Text>
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
  const allZero =
    input.bagsListed === 0 &&
    input.reserved === 0 &&
    input.pickedUp === 0 &&
    input.revenue === 0;

  return [
    { label: 'Bags Listed', value: String(input.bagsListed) },
    { label: 'Reserved', value: String(input.reserved) },
    { label: 'Picked Up', value: String(input.pickedUp) },
    {
      label: 'Revenue',
      value: allZero ? '—' : formatRsPaisa(input.revenue),
    },
  ];
}

const styles = StyleSheet.create({
  card: {
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Palette.white,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    color: Palette.primary,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#F0EDE8',
    marginVertical: 8,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginHorizontal: 8,
  },
});
