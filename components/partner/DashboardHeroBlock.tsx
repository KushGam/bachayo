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
  onMessages: () => void;
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
  onMessages,
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
        onMessages={onMessages}
      />

      <View style={styles.statsSection}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>Today</Text>
          <Text style={styles.title}>Snapshot</Text>
        </View>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
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
    color: Palette.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  statsSkeleton: {
    borderRadius: 20,
    padding: Spacing.sm,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
});
