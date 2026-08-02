import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryById } from '@/constants/partnerCategories';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress, hapticSuccess } from '@/lib/haptics';
import type { CustomerOrderWithDetails } from '@/types/app';

const RATING_LABELS: Record<number, string> = {
  1: '😞 Very disappointing',
  2: '😕 Not great',
  3: '😊 It was okay',
  4: '😄 Pretty good!',
  5: '🤩 Amazing!',
};

type ReviewPromptSheetProps = {
  visible: boolean;
  order: CustomerOrderWithDetails | null;
  submitting?: boolean;
  onSubmit: (rating: number, comment: string) => void;
  onDismiss: () => void;
};

export function ReviewPromptSheet({
  visible,
  order,
  submitting = false,
  onSubmit,
  onDismiss,
}: ReviewPromptSheetProps) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
    }
  }, [visible, order?.id]);

  if (!order) return null;

  const category = getCategoryById(order.partner.category);
  const canSubmit = rating > 0 && !submitting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <View style={styles.partnerRow}>
          {order.partner.cover_image_url ? (
            <Image source={{ uri: order.partner.cover_image_url }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverEmoji}>{category?.icon ?? '🍽'}</Text>
            </View>
          )}
          <View style={styles.partnerCopy}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {order.partner.name}
            </Text>
            <Text style={styles.promptLine}>How was your rescue bag?</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.rateLabel}>Rate your experience</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= rating;
            return (
              <Pressable
                key={star}
                onPress={() => {
                  void hapticButtonPress();
                  setRating(star);
                }}
                hitSlop={6}
                style={styles.starBtn}>
                <Text style={[styles.star, filled ? styles.starFilled : styles.starEmpty]}>★</Text>
              </Pressable>
            );
          })}
        </View>

        {rating > 0 ? <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text> : null}

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Tell us more... (optional)"
          placeholderTextColor={Palette.textTertiary}
          multiline
          style={styles.comment}
          textAlignVertical="top"
          maxLength={500}
          editable={!submitting}
        />

        <Pressable
          disabled={!canSubmit}
          onPress={() => {
            if (!canSubmit) return;
            void hapticSuccess();
            onSubmit(rating, comment);
          }}
          style={({ pressed }) => [
            styles.submit,
            !canSubmit && styles.submitDisabled,
            pressed && canSubmit && styles.pressed,
          ]}>
          {submitting ? (
            <ActivityIndicator color={Palette.white} />
          ) : (
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
              Submit review
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onDismiss();
          }}
          disabled={submitting}
          hitSlop={8}
          style={styles.skip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 25, 23, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: Palette.imagePlaceholder,
  },
  coverPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: {
    fontSize: 26,
  },
  partnerCopy: {
    flex: 1,
    gap: 2,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  promptLine: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.border,
    marginVertical: 16,
  },
  rateLabel: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  starBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontSize: 40,
    lineHeight: 44,
  },
  starFilled: {
    color: '#F59E0B',
  },
  starEmpty: {
    color: Palette.border,
  },
  ratingLabel: {
    ...Type.body,
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  comment: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    padding: 12,
    height: 80,
    fontSize: 14,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  submit: {
    marginTop: 16,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    backgroundColor: Palette.background,
  },
  submitText: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.white,
  },
  submitTextDisabled: {
    color: Palette.textTertiary,
  },
  skip: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipText: {
    ...Type.caption,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.92,
  },
});
