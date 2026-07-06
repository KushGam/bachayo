import { ShoppingBag } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/components/partner-detail/StarRating';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { avatarColor } from '@/lib/partnerDetailUi';
import { formatRelativeTime, getInitials } from '@/lib/helpers';
import type { PartnerReviewRow } from '@/lib/partnerDetail';

type PartnerDetailReviewCardProps = {
  review: PartnerReviewRow;
};

export function PartnerDetailReviewCard({ review }: PartnerDetailReviewCardProps) {
  const name = review.customer?.full_name || 'Customer';
  const bagTitle = review.order?.bag?.title ?? 'Rescue bag';

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(name) }]}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.name}>{name.split(' ')[0] ?? name}</Text>
          <Text style={styles.time}>{formatRelativeTime(review.created_at)}</Text>
        </View>
        <StarRating rating={review.rating} size={12} />
      </View>
      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
      <View style={styles.bagPill}>
        <ShoppingBag size={11} color={Palette.textTertiary} strokeWidth={2} />
        <Text style={styles.bagPillText}>{bagTitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    ...FloatingShadow,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  time: {
    ...Type.label,
    color: Palette.textTertiary,
  },
  comment: {
    marginTop: Spacing.sm,
    ...Type.body,
    color: Palette.textSecondary,
    lineHeight: 22,
  },
  bagPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.background,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: Spacing.sm,
  },
  bagPillText: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
  },
});
