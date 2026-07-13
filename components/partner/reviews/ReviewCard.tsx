import { ShoppingBag } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
  customer_id?: string;
  partner_id?: string;
  partner_reply?: string | null;
  partner_replied_at?: string | null;
};

type ReviewCardProps = {
  review: PartnerReviewItem;
  draftReply?: string;
  onDraftReplyChange?: (reviewId: string, value: string) => void;
  onPostReply?: (review: PartnerReviewItem, reply: string) => void;
};

const REPLY_MAX = 280;

export function ReviewCard({ review, draftReply, onDraftReplyChange, onPostReply }: ReviewCardProps) {
  const name = review.customer?.full_name || review.customer?.phone || 'Customer';
  const firstName = name.split(' ')[0] ?? name;
  const bagTitle = review.order?.bag?.title ?? 'Rescue bag';
  const [isEditing, setIsEditing] = useState(false);
  const [focused, setFocused] = useState(false);

  const draft = draftReply ?? '';
  const canPost = draft.trim().length > 0;
  const showComposer = !review.partner_reply || isEditing;

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

      {showComposer ? (
        <View style={styles.replyComposer}>
          <Text style={styles.replyHint}>
            {isEditing ? 'Edit your reply' : 'Reply to this review'}
          </Text>
          <TextInput
            value={draft}
            onChangeText={(text) => onDraftReplyChange?.(review.id, text.slice(0, REPLY_MAX))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Thank you for your feedback…"
            placeholderTextColor={Palette.textTertiary}
            multiline
            scrollEnabled
            textAlignVertical="top"
            underlineColorAndroid="transparent"
            autoCorrect
            autoCapitalize="sentences"
            style={[styles.replyInput, focused && styles.replyInputFocused]}
          />
          <View style={styles.composerFooter}>
            <Text style={styles.charCount}>
              {draft.length}/{REPLY_MAX}
            </Text>
            <View style={styles.composerActions}>
              {isEditing ? (
                <Pressable
                  onPress={() => {
                    setIsEditing(false);
                    onDraftReplyChange?.(review.id, '');
                  }}
                  style={styles.cancelBtn}
                  hitSlop={6}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  if (!canPost) return;
                  onPostReply?.(review, draft);
                  setIsEditing(false);
                }}
                disabled={!canPost}
                style={[styles.postReplyBtn, !canPost && styles.postReplyBtnDisabled]}>
                <Text style={styles.postReplyText}>{isEditing ? 'Update' : 'Post reply'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.replyWrap}>
          <Text style={styles.replyLabel}>Your reply</Text>
          <Text style={styles.replyText}>{review.partner_reply}</Text>
          {review.partner_replied_at ? (
            <Text style={styles.replyTime}>{formatRelativeTime(review.partner_replied_at)}</Text>
          ) : null}
          <Pressable
            onPress={() => {
              onDraftReplyChange?.(review.id, review.partner_reply ?? '');
              setIsEditing(true);
            }}
            hitSlop={6}>
            <Text style={styles.editReply}>Edit reply</Text>
          </Pressable>
        </View>
      )}
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
  replyWrap: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Palette.primary,
  },
  replyLabel: {
    fontSize: 11,
    color: Palette.primary,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  replyText: {
    fontSize: 14,
    color: Palette.textPrimary,
    marginTop: 6,
    lineHeight: 21,
  },
  replyTime: {
    fontSize: 11,
    color: Palette.textTertiary,
    marginTop: 6,
  },
  editReply: {
    fontSize: 12,
    color: Palette.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  replyComposer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  replyHint: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  replyInput: {
    minHeight: 96,
    maxHeight: 160,
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    backgroundColor: Palette.surface,
    paddingHorizontal: 14,
    // Explicit padding avoids iOS multiline jump while typing spaces
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    fontSize: 16,
    lineHeight: 22,
    color: Palette.textPrimary,
    textAlignVertical: 'top',
  },
  replyInputFocused: {
    borderColor: Palette.primary,
    backgroundColor: Palette.white,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  charCount: {
    ...Type.label,
    color: Palette.textTertiary,
  },
  composerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  postReplyBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  postReplyBtnDisabled: {
    opacity: 0.4,
  },
  postReplyText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
