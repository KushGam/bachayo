import { Check, Star } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PartnerDetailReviewCard } from '@/components/partner-detail/PartnerDetailReviewCard';
import { PartnerDetailSectionHeader } from '@/components/partner-detail/PartnerDetailSectionHeader';
import { StarRating } from '@/components/partner-detail/StarRating';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';
import type { PartnerDetailData, PartnerReviewRow } from '@/lib/partnerDetail';

type ReviewEligibility = {
  eligibleOrderId: string | null;
  hasPickedUpOrder: boolean;
  hasReviewed: boolean;
};

type PartnerDetailReviewsSectionProps = {
  stats: PartnerDetailData['stats'];
  reviews: PartnerReviewRow[];
  visibleReviews: PartnerReviewRow[];
  showAllReviews: boolean;
  reviewEligibility: ReviewEligibility | null;
  onShowAll: () => void;
  onWriteReview: (orderId: string) => void;
};

export function PartnerDetailReviewsSection({
  stats,
  reviews,
  visibleReviews,
  showAllReviews,
  reviewEligibility,
  onShowAll,
  onWriteReview,
}: PartnerDetailReviewsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <PartnerDetailSectionHeader
          title="Reviews"
          trailing={stats.totalReviews > 0 ? `${stats.totalReviews} reviews` : undefined}
        />
      </View>

      <View style={styles.ratingStrip}>
        {stats.totalReviews > 0 ? (
          <>
            <View style={styles.ratingLeft}>
              <Text style={styles.ratingScore}>{stats.avgRating.toFixed(1)}</Text>
              <StarRating rating={stats.avgRating} size={14} />
              <Text style={styles.ratingCount}>{stats.totalReviews} reviews</Text>
            </View>
            <View style={styles.ratingRight}>
              {stats.ratingBreakdown.map((row) => {
                const pct = stats.totalReviews > 0 ? (row.count / stats.totalReviews) * 100 : 0;
                return (
                  <View key={row.stars} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{row.stars}★</Text>
                    <View style={styles.breakdownTrack}>
                      <View style={[styles.breakdownFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.breakdownCount}>{row.count}</Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.ratingEmpty}>
            <StarRating rating={0} size={18} />
            <Text style={styles.ratingEmptyTitle}>No reviews yet</Text>
            <Text style={styles.ratingEmptySubtitle}>
              Be the first to rescue a bag and review!
            </Text>
          </View>
        )}
      </View>

      {reviewEligibility?.eligibleOrderId ? (
        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onWriteReview(reviewEligibility.eligibleOrderId!);
          }}
          style={styles.writeReviewBtn}>
          <Star size={14} color={Palette.primary} fill={Palette.primary} strokeWidth={2} />
          <Text style={styles.writeReviewBtnText}>Write a review</Text>
        </Pressable>
      ) : reviewEligibility ? (
        reviewEligibility.hasReviewed ? (
          <View style={styles.reviewedRow}>
            <Check size={14} color={Palette.success} strokeWidth={2.5} />
            <Text style={styles.reviewStatusReviewed}>You reviewed this restaurant</Text>
          </View>
        ) : (
          <Text style={styles.reviewStatusHint}>
            Reserve and pick up a bag to leave a review
          </Text>
        )
      ) : null}

      {reviews.length > 0 ? (
        <>
          {visibleReviews.map((review) => (
            <PartnerDetailReviewCard key={review.id} review={review} />
          ))}
          {reviews.length > 3 && !showAllReviews ? (
            <Pressable
              onPress={() => {
                void hapticButtonPress();
                onShowAll();
              }}
              style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all {stats.totalReviews} reviews →</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerWrap: {
    paddingHorizontal: Spacing.lg,
  },
  ratingStrip: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    ...FloatingShadow,
  },
  ratingEmpty: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  ratingEmptyTitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  ratingEmptySubtitle: {
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  writeReviewBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  writeReviewBtnText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
  reviewStatusHint: {
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  reviewedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  reviewStatusReviewed: {
    ...Type.label,
    color: Palette.success,
    fontWeight: '600',
  },
  ratingLeft: {
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
  ratingScore: {
    fontSize: 32,
    fontWeight: '800',
    color: Palette.primary,
  },
  ratingCount: {
    ...Type.label,
    color: Palette.textTertiary,
  },
  ratingRight: {
    flex: 1,
    gap: 5,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownLabel: {
    width: 22,
    ...Type.label,
    color: Palette.textTertiary,
  },
  breakdownTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.borderSubtle,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: Palette.primary,
    borderRadius: 2,
  },
  breakdownCount: {
    width: 18,
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'right',
  },
  seeAll: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  seeAllText: {
    textAlign: 'center',
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
});
