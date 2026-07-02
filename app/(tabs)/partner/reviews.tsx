import { Star } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListSkeleton } from '@/components/ui/Skeleton';
import { RetryState } from '@/components/ui/RetryState';
import { formatRelativeTime, getInitials } from '@/lib/helpers';
import { fetchPartnerReviews } from '@/lib/orders';
import { supabase } from '@/lib/supabase';

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer: { full_name: string | null; phone: string | null } | null;
  order: { bag: { title: string } | null } | null;
};

const TERRACOTTA = '#D85A30';
const BG = '#F5F3EF';
const MUTED = '#6B7280';
const TEXT_BODY = '#374151';

const AVATAR_COLORS = ['#D85A30', '#993C1D', '#B45309', '#065F46', '#1D4ED8', '#7C3AED'];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function OutlinedStars({ size = 18 }: { size?: number }) {
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} color={TERRACOTTA} strokeWidth={2} />
      ))}
    </View>
  );
}

function FilledStars({ rating, size = 14 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating);
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          color={TERRACOTTA}
          fill={i < rounded ? TERRACOTTA : 'transparent'}
          strokeWidth={2}
        />
      ))}
    </View>
  );
}

function TipsCard() {
  const tips = [
    { emoji: '🕐', text: 'Always be ready during your pickup window' },
    {
      emoji: '🛍',
      text: 'Pack bags generously — surprise customers with a little extra',
    },
    { emoji: '😊', text: 'Greet customers warmly — a smile earns 5 stars' },
  ];

  return (
    <View style={styles.tipsCard}>
      <View style={styles.tipsTitleRow}>
        <View style={styles.tipsTitleIcon}>
          <Text style={styles.tipsTitleEmoji}>⭐</Text>
        </View>
        <Text style={styles.tipsTitle}>How to earn great reviews</Text>
      </View>

      {tips.map((tip) => (
        <View key={tip.text} style={styles.tipRow}>
          <View style={styles.tipIcon}>
            <Text style={styles.tipEmoji}>{tip.emoji}</Text>
          </View>
          <Text style={styles.tipText}>{tip.text}</Text>
        </View>
      ))}

      <Text style={styles.tipsNote}>
        Your rating affects how high you appear in customer search results
      </Text>
    </View>
  );
}

function ReviewsEmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyCircle}>
        <Text style={styles.emptyEmoji}>⭐</Text>
      </View>
      <Text style={styles.emptyTitle}>No reviews yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete your first pickups and{'\n'}customers can leave you a review
      </Text>
      <View style={styles.emptyPill}>
        <Text style={styles.emptyPillText}>Reviews appear after pickup is confirmed</Text>
      </View>
    </View>
  );
}

export default function PartnerReviewsScreen() {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setErrorText(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!partner) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const rows = await fetchPartnerReviews(partner.id);
      setReviews(rows as unknown as ReviewRow[]);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const average = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const breakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) counts[r.rating - 1] += 1;
    return counts.reverse().map((count, i) => ({ stars: 5 - i, count }));
  }, [reviews]);

  const fiveStarCount = useMemo(
    () => reviews.filter((review) => Math.round(review.rating) === 5).length,
    [reviews],
  );

  const recent30DaysCount = useMemo(() => {
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return reviews.filter((review) => new Date(review.created_at).getTime() >= threshold).length;
  }, [reviews]);

  const hasReviews = reviews.length > 0;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Reviews</Text>
            <Text style={styles.headerSubtitle}>Customer feedback and rating trends</Text>
          </View>
          <Star size={24} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.5} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TERRACOTTA} />
        }>
        {!loading && !errorText ? (
          <View style={styles.summaryCard}>
            {hasReviews ? (
              <>
                <View style={styles.summaryFilled}>
                  <View style={styles.summaryLeft}>
                    <Text style={styles.bigRating}>{average.toFixed(1)}</Text>
                    <FilledStars rating={average} size={16} />
                    <Text style={styles.reviewCountMuted}>{reviews.length} reviews</Text>
                  </View>
                  <View style={styles.summaryRight}>
                    {breakdown.map((row) => {
                      const pct = reviews.length > 0 ? (row.count / reviews.length) * 100 : 0;
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
                </View>

                <View style={styles.summaryStatsRow}>
                  <View style={styles.summaryStatPill}>
                    <Text style={styles.summaryStatLabel}>5★ reviews</Text>
                    <Text style={styles.summaryStatValue}>{fiveStarCount}</Text>
                  </View>
                  <View style={styles.summaryStatPill}>
                    <Text style={styles.summaryStatLabel}>Last 30 days</Text>
                    <Text style={styles.summaryStatValue}>{recent30DaysCount}</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.summaryEmpty}>
                <Text style={styles.bigRating}>0.0</Text>
                <OutlinedStars />
                <Text style={styles.noReviewsYet}>No reviews yet</Text>
              </View>
            )}
          </View>
        ) : null}

        {errorText ? (
          <View style={styles.errorWrap}>
            <RetryState message={errorText} onRetry={loadReviews} />
          </View>
        ) : null}

        {loading ? (
          <View style={styles.skeletonWrap}>
            <ListSkeleton count={3} />
          </View>
        ) : null}

        {!loading && !errorText && !hasReviews ? (
          <>
            <TipsCard />
            <ReviewsEmptyState />
          </>
        ) : null}

        {!loading && !errorText && hasReviews ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Customer reviews</Text>
              <Text style={styles.sectionHint}>Newest first</Text>
            </View>
            {reviews.map((review) => {
              const name = review.customer?.full_name || review.customer?.phone || 'Customer';
              const firstName = name.split(' ')[0] ?? name;
              const bagTitle = review.order?.bag?.title ?? 'Rescue bag';

              return (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <View style={[styles.avatar, { backgroundColor: avatarColor(name) }]}>
                      <Text style={styles.avatarText}>{getInitials(name)}</Text>
                    </View>

                    <View style={styles.reviewCenter}>
                      <Text style={styles.customerName}>{firstName}</Text>
                      <Text style={styles.reviewTime}>{formatRelativeTime(review.created_at)}</Text>
                    </View>

                    <View style={styles.reviewRating}>
                      <FilledStars rating={review.rating} size={12} />
                      <View style={styles.reviewRatingBadge}>
                        <Text style={styles.reviewRatingNum}>{review.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                  </View>

                  {review.comment ? (
                    <Text style={styles.comment}>{review.comment}</Text>
                  ) : (
                    <Text style={styles.emptyComment}>No written comment</Text>
                  )}

                  <View style={styles.bagPill}>
                    <Text style={styles.bagPillText}>🛍 {bagTitle}</Text>
                  </View>
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: TERRACOTTA,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
  },
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  summaryCard: {
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
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
  summaryEmpty: {
    alignItems: 'center',
    gap: 8,
  },
  summaryFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryLeft: {
    alignItems: 'center',
    minWidth: 88,
    gap: 6,
  },
  summaryRight: {
    flex: 1,
    gap: 6,
  },
  summaryStatsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  summaryStatPill: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#F0EDE8',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryStatValue: {
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  bigRating: {
    fontSize: 36,
    fontWeight: '700',
    color: TERRACOTTA,
  },
  noReviewsYet: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  reviewCountMuted: {
    fontSize: 13,
    color: MUTED,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownLabel: {
    width: 22,
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
  },
  breakdownTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0EDE8',
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: TERRACOTTA,
    borderRadius: 2,
  },
  breakdownCount: {
    width: 18,
    fontSize: 11,
    color: MUTED,
    textAlign: 'right',
  },
  errorWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0EDE8',
  },
  tipsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsTitleEmoji: {
    fontSize: 18,
  },
  tipsTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipEmoji: {
    fontSize: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  tipsNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
    marginTop: 12,
    lineHeight: 18,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  emptyPill: {
    backgroundColor: BG,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  emptyPillText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionHeaderRow: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHint: {
    fontSize: 12,
    color: MUTED,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  reviewCenter: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  reviewTime: {
    fontSize: 12,
    color: MUTED,
  },
  reviewRating: {
    alignItems: 'flex-end',
    gap: 4,
  },
  reviewRatingBadge: {
    backgroundColor: '#FAECE7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reviewRatingNum: {
    fontSize: 12,
    fontWeight: '600',
    color: TERRACOTTA,
  },
  comment: {
    marginTop: 10,
    fontSize: 14,
    color: TEXT_BODY,
    lineHeight: 22,
  },
  emptyComment: {
    marginTop: 10,
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  bagPill: {
    alignSelf: 'flex-start',
    backgroundColor: BG,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  bagPillText: {
    fontSize: 11,
    color: MUTED,
  },
});
