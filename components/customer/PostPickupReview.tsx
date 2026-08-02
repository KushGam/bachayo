import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const EMOJIS = ['😞', '😕', '😊', '😄', '🤩'] as const;
const LABELS = [
  'Very disappointing',
  'Not great',
  'It was okay',
  'Pretty good!',
  'Amazing!',
] as const;

const QUICK_TAGS = [
  'Delicious food',
  'Good portions',
  'Quick pickup',
  'Great value',
  'Friendly staff',
  'Fresh food',
  'Will order again',
  'Easy to find',
] as const;

type PostPickupReviewProps = {
  visible: boolean;
  order: CustomerOrderWithDetails | null;
  submitting?: boolean;
  /** Return true when the review was saved successfully. */
  onSubmit: (rating: number, comment: string) => Promise<boolean> | boolean;
  onDismiss: () => void;
};

export function PostPickupReview({
  visible,
  order,
  submitting = false,
  onSubmit,
  onDismiss,
}: PostPickupReviewProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const busy = submitting || localSubmitting;

  useEffect(() => {
    if (!visible) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    setRating(0);
    setComment('');
    setSelectedTags([]);
    setSubmitted(false);
    setLocalSubmitting(false);
    scaleAnim.setValue(1);
    slideAnim.setValue(SCREEN_HEIGHT);
    fadeAnim.setValue(0);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 90,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    void hapticSuccess();
  }, [visible, order?.id, fadeAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!order) return null;

  const category = getCategoryById(order.partner.category);
  const bagTitle = order.bag?.title ?? 'Rescue bag';

  const handleStarPress = (star: number) => {
    if (busy || submitted) return;
    setRating(star);
    void hapticButtonPress();
    scaleAnim.setValue(0.85);
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 10,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  };

  const toggleTag = (tag: string) => {
    if (busy || submitted) return;
    void hapticButtonPress();
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    if (rating === 0 || busy || submitted) return;

    const fullComment = [...selectedTags, comment.trim()].filter(Boolean).join(' · ');

    setLocalSubmitting(true);
    try {
      const ok = await onSubmit(rating, fullComment);
      if (!ok) return;

      setSubmitted(true);
      void hapticSuccess();

      closeTimerRef.current = setTimeout(() => {
        onDismiss();
      }, 2000);
    } finally {
      setLocalSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (busy) return;
    void hapticButtonPress();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleSkip}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={rating > 0 ? undefined : handleSkip} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetWrap,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              {submitted ? (
                <View style={styles.successWrap}>
                  <Text style={styles.successEmoji}>🙏</Text>
                  <Text style={styles.successTitle}>धन्यवाद! Thank you!</Text>
                  <Text style={styles.successBody}>
                    Your review helps others find great rescue bags
                  </Text>
                  <View style={styles.successStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text
                        key={star}
                        style={[
                          styles.successStar,
                          star <= rating ? styles.starFilled : styles.starEmpty,
                        ]}>
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
              ) : (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={styles.formContent}>
                  <View style={styles.headerRow}>
                    <View style={styles.coverWrap}>
                      {order.partner.cover_image_url ? (
                        <Image
                          source={{ uri: order.partner.cover_image_url }}
                          style={styles.cover}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.coverEmoji}>{category?.icon ?? '🛍'}</Text>
                      )}
                    </View>

                    <View style={styles.headerCopy}>
                      <Text style={styles.eyebrow}>You rescued from</Text>
                      <Text style={styles.partnerName} numberOfLines={1}>
                        {order.partner.name}
                      </Text>
                      <Text style={styles.bagTitle} numberOfLines={1}>
                        {bagTitle}
                      </Text>
                    </View>

                    <Pressable onPress={handleSkip} hitSlop={8} style={styles.closeBtn}>
                      <Text style={styles.closeText}>×</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.question}>How was your rescue bag?</Text>

                  <View style={styles.ratingBlock}>
                    {rating > 0 ? (
                      <Animated.Text style={[styles.emoji, { transform: [{ scale: scaleAnim }] }]}>
                        {EMOJIS[rating - 1]}
                      </Animated.Text>
                    ) : (
                      <View style={styles.emojiPlaceholder} />
                    )}

                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable
                          key={star}
                          onPress={() => handleStarPress(star)}
                          hitSlop={6}
                          style={styles.starBtn}>
                          <Text
                            style={[
                              styles.star,
                              star <= rating ? styles.starFilled : styles.starEmpty,
                            ]}>
                            ★
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {rating > 0 ? <Text style={styles.ratingLabel}>{LABELS[rating - 1]}</Text> : null}
                  </View>

                  {rating > 0 ? (
                    <>
                      <Text style={styles.tagsLabel}>What did you love?</Text>
                      <View style={styles.tagsWrap}>
                        {QUICK_TAGS.map((tag) => {
                          const selected = selectedTags.includes(tag);
                          return (
                            <Pressable
                              key={tag}
                              onPress={() => toggleTag(tag)}
                              style={[styles.tag, selected && styles.tagSelected]}>
                              <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                                {tag}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <TextInput
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Add a comment… (optional)"
                        placeholderTextColor={Palette.textTertiary}
                        multiline
                        style={styles.comment}
                        textAlignVertical="top"
                        maxLength={500}
                        editable={!busy}
                      />
                    </>
                  ) : null}

                  <Pressable
                    disabled={rating === 0 || busy}
                    onPress={() => void handleSubmit()}
                    style={({ pressed }) => [
                      styles.submit,
                      rating === 0 && styles.submitDisabled,
                      pressed && rating > 0 && !busy && styles.pressed,
                    ]}>
                    {busy ? (
                      <ActivityIndicator color={Palette.white} />
                    ) : (
                      <Text
                        style={[styles.submitText, rating === 0 && styles.submitTextDisabled]}>
                        {rating === 0 ? 'Tap stars to rate' : 'Submit review →'}
                      </Text>
                    )}
                  </Pressable>

                  <Pressable onPress={handleSkip} disabled={busy} hitSlop={8} style={styles.skip}>
                    <Text style={styles.skipText}>Skip for now</Text>
                  </Pressable>
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 25, 23, 0.55)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: SCREEN_HEIGHT * 0.92,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  coverWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cover: {
    width: 64,
    height: 64,
  },
  coverEmoji: {
    fontSize: 28,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  bagTitle: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: Palette.textTertiary,
    marginTop: -1,
  },
  question: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  ratingBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  emojiPlaceholder: {
    height: 52,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  starBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontSize: 42,
    lineHeight: 48,
  },
  starFilled: {
    color: '#F59E0B',
  },
  starEmpty: {
    color: Palette.border,
  },
  ratingLabel: {
    ...Type.body,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginTop: 6,
  },
  tagsLabel: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginTop: 18,
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  tagSelected: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primaryLight,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  tagTextSelected: {
    color: Palette.primaryDark,
  },
  comment: {
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: 14,
    padding: 12,
    height: 80,
    fontSize: 14,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
    marginBottom: 18,
  },
  submit: {
    height: 56,
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
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.3,
  },
  submitTextDisabled: {
    color: Palette.textTertiary,
  },
  skip: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipText: {
    ...Type.caption,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  successWrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 40,
  },
  successEmoji: {
    fontSize: 56,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Palette.textPrimary,
    marginTop: 14,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  successBody: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  successStars: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 16,
  },
  successStar: {
    fontSize: 28,
  },
  pressed: {
    opacity: 0.92,
  },
});
