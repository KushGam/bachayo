import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RatingSummaryCard } from '@/components/partner/reviews/RatingSummaryCard';
import { ReviewCard, type PartnerReviewItem } from '@/components/partner/reviews/ReviewCard';
import { ReviewsEmptyState } from '@/components/partner/reviews/ReviewsEmptyState';
import { ReviewsHeader } from '@/components/partner/reviews/ReviewsHeader';
import { ReviewsTipsCard } from '@/components/partner/reviews/ReviewsTipsCard';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { RetryState } from '@/components/ui/RetryState';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';
import { fetchPartnerReviews } from '@/lib/orders';
import { sendNotification } from '@/lib/sendNotification';
import { supabase } from '@/lib/supabase';

export default function PartnerReviewsScreen() {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const [reviews, setReviews] = useState<PartnerReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [partnerName, setPartnerName] = useState('');

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
        .select('id, name')
        .eq('user_id', userId)
        .maybeSingle();

      if (!partner) {
        setReviews([]);
        setLoading(false);
        return;
      }
      setPartnerName(partner.name ?? 'Restaurant');

      const rows = await fetchPartnerReviews(partner.id);
      setReviews(rows as unknown as PartnerReviewItem[]);

      if (rows.length > 0) {
        const { error: rpcError } = await supabase.rpc('recalculate_partner_rating', {
          p_partner_id: partner.id,
        });
        if (rpcError) {
          console.warn('[partner-reviews] rating sync failed:', rpcError.message);
        }
      }
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useFocusEffect(
    useCallback(() => {
      void loadReviews();
    }, [loadReviews]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const average = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const breakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const review of reviews) counts[review.rating - 1] += 1;
    return counts.reverse().map((count, index) => ({ stars: 5 - index, count }));
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

  const postReply = async (review: PartnerReviewItem, reply: string) => {
    const trimmed = reply.trim();
    if (!trimmed) return;
    const repliedAt = new Date().toISOString();
    const { error } = await supabase
      .from('reviews')
      .update({
        partner_reply: trimmed,
        partner_replied_at: repliedAt,
      })
      .eq('id', review.id);
    if (error) {
      Alert.alert('Error', 'Failed to post reply');
      return;
    }

    setReviews((prev) =>
      prev.map((item) =>
        item.id === review.id
          ? { ...item, partner_reply: trimmed, partner_replied_at: repliedAt }
          : item,
      ),
    );
    setDraftReplies((prev) => ({ ...prev, [review.id]: '' }));

    if (review.customer_id) {
      await sendNotification({
        userId: review.customer_id,
        title: `${partnerName} replied to your review`,
        body: `${trimmed.slice(0, 80)}${trimmed.length > 80 ? '...' : ''}`,
        type: 'review_reply',
        data: {
          review_id: review.id,
          partner_id: review.partner_id,
          type: 'review_reply',
        },
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        Platform.OS === 'android' ? { paddingBottom: keyboardInset } : null,
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <StatusBar style="light" />

      <ReviewsHeader paddingTop={insets.top + Spacing.md} reviewCount={reviews.length} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
        }>
        {!loading && !errorText ? (
          <RatingSummaryCard
            average={average}
            totalReviews={reviews.length}
            breakdown={breakdown}
            fiveStarCount={fiveStarCount}
            recent30DaysCount={recent30DaysCount}
          />
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
            <ReviewsTipsCard />
            <ReviewsEmptyState />
          </>
        ) : null}

        {!loading && !errorText && hasReviews ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Customer reviews</Text>
              <Text style={styles.sectionHint}>Newest first</Text>
            </View>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                draftReply={draftReplies[review.id] ?? ''}
                onDraftReplyChange={(reviewId, value) =>
                  setDraftReplies((prev) => ({ ...prev, [reviewId]: value }))
                }
                onPostReply={postReply}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  errorWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Type.h2,
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  sectionHint: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
});
