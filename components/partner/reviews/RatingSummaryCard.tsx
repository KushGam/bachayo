import { StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/components/partner/reviews/StarRating';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

type BreakdownRow = {
  stars: number;
  count: number;
};

type RatingSummaryCardProps = {
  average: number;
  totalReviews: number;
  breakdown: BreakdownRow[];
  fiveStarCount: number;
  recent30DaysCount: number;
};

export function RatingSummaryCard({
  average,
  totalReviews,
  breakdown,
  fiveStarCount,
  recent30DaysCount,
}: RatingSummaryCardProps) {
  const hasReviews = totalReviews > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Overview</Text>
      <View style={styles.card}>
        {hasReviews ? (
          <>
            <View style={styles.mainRow}>
              <View style={styles.scoreCol}>
                <Text style={styles.score}>{average.toFixed(1)}</Text>
                <StarRating rating={average} size={16} />
                <Text style={styles.countLabel}>
                  {totalReviews} review{totalReviews === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={styles.breakdownCol}>
                {breakdown.map((row) => {
                  const pct = totalReviews > 0 ? (row.count / totalReviews) * 100 : 0;
                  return (
                    <View key={row.stars} style={styles.breakdownRow}>
                      <Text style={styles.breakdownStars}>{row.stars}</Text>
                      <View style={styles.breakdownTrack}>
                        <View style={[styles.breakdownFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.breakdownCount}>{row.count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>5-star reviews</Text>
                <Text style={styles.statValue}>{fiveStarCount}</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Last 30 days</Text>
                <Text style={styles.statValue}>{recent30DaysCount}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.scoreMuted}>—</Text>
            <StarRating rating={0} size={16} variant="outline" />
            <Text style={styles.emptyCopy}>Your first reviews will appear here</Text>
          </View>
        )}
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
    padding: Spacing.lg,
    ...FloatingShadow,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  scoreCol: {
    alignItems: 'center',
    minWidth: 92,
    gap: 6,
  },
  score: {
    fontSize: 40,
    fontWeight: '700',
    color: Palette.primary,
    letterSpacing: -1,
    lineHeight: 44,
  },
  countLabel: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  breakdownCol: {
    flex: 1,
    gap: 7,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownStars: {
    width: 10,
    ...Type.label,
    fontWeight: '700',
    color: Palette.textTertiary,
    textAlign: 'center',
  },
  breakdownTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.borderSubtle,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: Palette.primary,
    borderRadius: 3,
  },
  breakdownCount: {
    width: 20,
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'right',
  },
  statsRow: {
    marginTop: Spacing.md + 2,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statPill: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  scoreMuted: {
    fontSize: 32,
    fontWeight: '700',
    color: Palette.textTertiary,
  },
  emptyCopy: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
});
