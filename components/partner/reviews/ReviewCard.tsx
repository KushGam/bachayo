import { ShoppingBag } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/components/partner/reviews/StarRating';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatRelativeTime, getInitials } from '@/lib/helpers';

export type PartnerReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer: { full_name: string | null; phone: string | null } | null;
  order: { bag: { title: string } | null } | null;
};

type ReviewCardProps = {
  review: PartnerReviewItem;
};

export function ReviewCard({ review }: ReviewCardProps) {
  const name = review.customer?.full_name || review.customer?.phone || 'Customer';
  const firstName = name.split(' ')[0] ?? name;
  const bagTitle = review.order?.bag?.title ?? 'Rescue bag';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.name}>{firstName}</Text>
          <Text style={styles.time}>{formatRelativeTime(review.created_at)}</Text>
        </View>

        <View style={styles.ratingCol}>
          <StarRating rating={review.rating} size={12} />
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingValue}>{review.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {review.comment ? (
        <View style={styles.quoteBlock}>
          <Text style={styles.comment}>{review.comment}</Text>
        </View>
      ) : (
        <Text style={styles.noComment}>No written comment</Text>
      )}

      <View style={styles.bagPill}>
        <ShoppingBag size={12} color={Palette.textSecondary} strokeWidth={2} />
        <Text style={styles.bagText} numberOfLines={1}>
          {bagTitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 2,
    padding: Spacing.lg,
    ...FloatingShadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Palette.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  time: {
    ...Type.label,
    color: Palette.textTertiary,
  },
  ratingCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ratingBadge: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ratingValue: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  quoteBlock: {
    marginTop: Spacing.md,
    paddingLeft: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Palette.primaryLightAlt,
  },
  comment: {
    ...Type.body,
    color: Palette.textPrimary,
    lineHeight: 22,
  },
  noComment: {
    marginTop: Spacing.md,
    ...Type.caption,
    color: Palette.textTertiary,
    fontStyle: 'italic',
  },
  bagPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.background,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: Spacing.md,
    maxWidth: '100%',
  },
  bagText: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
});
