import { StyleSheet, Text, View } from 'react-native';

import { DashboardHeader } from '@/components/partner/DashboardHeader';
import { DashboardStatsRow, type DashboardStat } from '@/components/partner/DashboardStatsRow';
import { StatsSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';

type DashboardHeroBlockProps = {
  partnerName: string;
  categoryLabel: string;
  categoryIcon: string;
  dateLabel: string;
  paddingTop: number;
  stats: DashboardStat[];
  loading: boolean;
  onNotifications: () => void;
};

export function DashboardHeroBlock({
  partnerName,
  categoryLabel,
  categoryIcon,
  dateLabel,
  paddingTop,
  stats,
  loading,
  onNotifications,
}: DashboardHeroBlockProps) {
  return (
    <View style={styles.shell}>
      <DashboardHeader
        partnerName={partnerName}
        categoryLabel={categoryLabel}
        categoryIcon={categoryIcon}
        dateLabel={dateLabel}
        paddingTop={paddingTop}
        onNotifications={onNotifications}
      />

      <View style={styles.statsSection}>
        <Text style={styles.statsEyebrow}>Today</Text>
        {loading ? (
          <View style={styles.statsSkeleton}>
            <StatsSkeleton />
          </View>
        ) : (
          <DashboardStatsRow stats={stats} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: Palette.background,
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md + 4,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statsEyebrow: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginLeft: 2,
  },
  statsSkeleton: {
    borderRadius: 16,
    padding: Spacing.lg,
    backgroundColor: Palette.surfaceMuted,
  },
});
