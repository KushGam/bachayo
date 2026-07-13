import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ChevronLeft, Star, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { getCategoryById } from '@/constants/partnerCategories';
import { formatRsPaisa } from '@/lib/helpers';
import { hapticButtonPress } from '@/lib/haptics';
import {
  fetchOrderForReview,
  formatPickedUpLabel,
  QUANTITY_OPTIONS,
  QUICK_REVIEW_TAGS,
  RATING_LABELS,
  RETURN_OPTIONS,
  submitCustomerReview,
  VALUE_OPTIONS,
  type MiniRatingOption,
  type ReviewOrderContext,
} from '@/lib/reviews';
import { supabase } from '@/lib/supabase';
import { uploadReviewPhoto } from '@/lib/upload';

const TERRACOTTA = '#D85A30';
const BG = '#F5F3EF';
const MUTED = '#6B7280';
const MAX_COMMENT = 200;

function formatNprFromPaisa(paisa: number) {
  return formatRsPaisa(paisa).replace('Rs ', '₨');
}

function StarButton({
  index,
  selected,
  onPress,
}: {
  index: number;
  selected: boolean;
  onPress: (value: number) => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(1.2, { damping: 12, stiffness: 280 }), withSpring(1));
    onPress(index);
  };

  return (
    <Pressable onPress={handlePress} style={styles.starTouch} hitSlop={4}>
      <Animated.View style={animatedStyle}>
        <Star
          size={36}
          color={selected ? TERRACOTTA : '#D1D5DB'}
          fill={selected ? TERRACOTTA : 'transparent'}
          strokeWidth={2}
        />
      </Animated.View>
    </Pressable>
  );
}

function MiniRatingRow({
  icon,
  title,
  options,
  value,
  onChange,
}: {
  icon: string;
  title: string;
  options: MiniRatingOption[];
  value: string | null;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.miniRow}>
      <View style={styles.miniRowLeft}>
        <Text style={styles.miniIcon}>{icon}</Text>
        <Text style={styles.miniLabel}>{title}</Text>
      </View>
      <View style={styles.miniPills}>
        {options.map((option) => {
          const active = value === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                void hapticButtonPress();
                onChange(option.key);
              }}
              style={[styles.miniPill, active && styles.miniPillActive]}>
              <Text style={[styles.miniPillText, active && styles.miniPillTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ReviewSuccess({
  partnerName,
  rating,
  onDone,
}: {
  partnerName: string;
  rating: number;
  onDone: () => void;
}) {
  const burst = useSharedValue(0);

  useEffect(() => {
    burst.value = withSpring(1, { damping: 14, stiffness: 160 });
  }, [burst]);

  const burstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burst.value }],
    opacity: burst.value,
  }));

  return (
    <View style={styles.successScreen}>
      <StatusBar style="light" />
      <Animated.View style={[styles.successContent, burstStyle]}>
        <Text style={styles.successEmoji}>⭐</Text>
        <Text style={styles.successTitle}>Thank you!</Text>
        <Text style={styles.successSubtitle}>
          Your review helps other customers{'\n'}find great rescue bags
        </Text>
        <Text style={styles.successPartner}>{partnerName}</Text>
        <View style={styles.successStars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={18}
              color="#FFFFFF"
              fill={i < rating ? '#FFFFFF' : 'transparent'}
              strokeWidth={2}
            />
          ))}
        </View>
        <Pressable onPress={onDone} style={styles.successBtn}>
          <Text style={styles.successBtnText}>Back to My Bags</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function LeaveReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<ReviewOrderContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [quantityFeedback, setQuantityFeedback] = useState<string | null>(null);
  const [valueFeedback, setValueFeedback] = useState<string | null>(null);
  const [wouldReturn, setWouldReturn] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [usedTags, setUsedTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [commentFocused, setCommentFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setErrorText(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setErrorText('Please sign in to leave a review');
        setOrder(null);
        return;
      }

      const row = await fetchOrderForReview(orderId);
      if (!row) {
        setErrorText('Order not found');
        setOrder(null);
        return;
      }

      if (row.customer_id !== userId) {
        setErrorText('You can only review your own orders');
        setOrder(null);
        return;
      }

      if (row.status !== 'picked_up') {
        setErrorText('You can review this order after pickup');
        setOrder(null);
        return;
      }

      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (existingReview) {
        setErrorText('You already reviewed this order');
        setOrder(null);
        return;
      }

      setOrder(row);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to load order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const category = order ? getCategoryById(order.partner?.category ?? 'restaurant') : null;
  const ratingLabel = rating > 0 ? RATING_LABELS[rating] : null;

  const appendTag = (tag: string) => {
    if (usedTags.includes(tag)) return;
    void hapticButtonPress();
    setUsedTags((prev) => [...prev, tag]);
    setComment((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return prev;
      return `${trimmed} ${tag}`;
    });
  };

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach a picture.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.85,
          });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const showPhotoPicker = () => {
    void hapticButtonPress();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Camera', 'Photo Library', 'Cancel'], cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) void pickPhoto('camera');
          if (index === 1) void pickPhoto('gallery');
        },
      );
      return;
    }
    Alert.alert('Add photo', undefined, [
      { text: 'Camera', onPress: () => void pickPhoto('camera') },
      { text: 'Photo Library', onPress: () => void pickPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!order || rating < 1) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        try {
          photoUrl = await uploadReviewPhoto(userId, photoUri);
        } catch {
          Alert.alert('Photo upload failed', 'Submitting your review without the photo.');
        }
      }

      const quantityLabel =
        QUANTITY_OPTIONS.find((option) => option.key === quantityFeedback)?.label ?? null;
      const valueLabel = VALUE_OPTIONS.find((option) => option.key === valueFeedback)?.label ?? null;
      const returnLabel = RETURN_OPTIONS.find((option) => option.key === wouldReturn)?.label ?? null;

      const { error } = await submitCustomerReview({
        orderId: order.id,
        customerId: userId,
        partnerId: order.partner_id,
        rating,
        comment: comment.slice(0, MAX_COMMENT),
        quantityFeedback: quantityLabel,
        valueFeedback: valueLabel,
        wouldReturn: returnLabel,
        photoUrl,
      });

      if (error) {
        Alert.alert('Could not submit review', error.message);
        return;
      }

      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const stickyFooter = useMemo(
    () => (
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={rating < 1 || submitting}
          style={[
            styles.submitBtn,
            (rating < 1 || submitting) && styles.submitBtnDisabled,
          ]}>
          {submitting ? (
            <View style={styles.submittingRow}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Submitting...</Text>
            </View>
          ) : (
            <Text style={[styles.submitBtnText, rating < 1 && styles.submitBtnTextDisabled]}>
              Submit review
            </Text>
          )}
        </Pressable>
      </View>
    ),
    [comment, insets.bottom, order, photoUri, quantityFeedback, rating, submitting, valueFeedback, wouldReturn],
  );

  if (success && order) {
    return (
      <ReviewSuccess
        partnerName={order.partner?.name ?? 'Restaurant'}
        rating={rating}
        onDone={() => router.replace('/(tabs)/customer/my-bags')}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
              <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Leave a review</Text>
            </View>
            <View style={styles.headerBtnSpacer} />
          </View>
        </View>
        <View style={{ paddingTop: 16 }}>
          <ListSkeleton count={2} />
        </View>
      </View>
    );
  }

  if (errorText || !order) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <StatusBar style="dark" />
        <RetryState message={errorText ?? 'Unable to load order'} onRetry={load} />
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
            <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Leave a review</Text>
            <Text style={styles.headerSubtitle}>Help others find great rescue bags</Text>
          </View>
          <View style={styles.headerBtnSpacer} />
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        footer={stickyFooter}>
        <View style={styles.summaryCard}>
          {order.partner?.cover_image_url ? (
            <Image source={{ uri: order.partner.cover_image_url }} style={styles.summaryImage} />
          ) : (
            <View style={[styles.summaryImage, styles.summaryImagePlaceholder]}>
              <Text style={styles.summaryEmoji}>{category?.icon ?? '🍽'}</Text>
            </View>
          )}
          <View style={styles.summaryCenter}>
            <Text style={styles.summaryPartner} numberOfLines={2}>
              {order.partner?.name ?? 'Restaurant'}
            </Text>
            <Text style={styles.summaryBag} numberOfLines={1}>
              {order.bag?.title ?? 'Rescue bag'}
            </Text>
            <Text style={styles.summaryPickup}>{formatPickedUpLabel(order.picked_up_at)}</Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryPrice}>{formatNprFromPaisa(order.total_price)}</Text>
            <Text style={styles.summaryPaid}>paid at pickup</Text>
          </View>
        </View>

        <View style={styles.formSheet}>
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>How was your experience?</Text>
            <Text style={styles.ratingSubtitle}>Tap to rate</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <StarButton
                  key={star}
                  index={star}
                  selected={star <= rating}
                  onPress={(value) => {
                    void hapticButtonPress();
                    setRating(value);
                  }}
                />
              ))}
            </View>
            {ratingLabel ? (
              <Animated.Text
                entering={FadeIn.duration(200)}
                style={[styles.ratingLabel, { color: ratingLabel.color }]}>
                {ratingLabel.text}
              </Animated.Text>
            ) : null}
          </View>

          {rating > 0 ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.miniSection}>
              <Text style={styles.miniSectionTitle}>What did you think of...</Text>
              <MiniRatingRow
                icon="🍱"
                title="Food quantity"
                options={QUANTITY_OPTIONS}
                value={quantityFeedback}
                onChange={setQuantityFeedback}
              />
              <MiniRatingRow
                icon="💰"
                title="Value for money"
                options={VALUE_OPTIONS}
                value={valueFeedback}
                onChange={setValueFeedback}
              />
              <MiniRatingRow
                icon="🔄"
                title="Would you come back?"
                options={RETURN_OPTIONS}
                value={wouldReturn}
                onChange={setWouldReturn}
              />
            </Animated.View>
          ) : null}

          <View style={styles.commentSection}>
            <Text style={styles.fieldLabel}>Add a comment (optional)</Text>
            <TextInput
              value={comment}
              onChangeText={(text) => setComment(text.slice(0, MAX_COMMENT))}
              onFocus={() => setCommentFocused(true)}
              onBlur={() => setCommentFocused(false)}
              placeholder="What did you love? Any suggestions for the restaurant?"
              placeholderTextColor="#9CA3AF"
              multiline
              style={[styles.commentInput, commentFocused && styles.commentInputFocused]}
            />
            <Text style={styles.charCount}>
              {comment.length}/{MAX_COMMENT}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsRow}>
              {QUICK_REVIEW_TAGS.map((tag) => {
                const used = usedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    disabled={used}
                    onPress={() => appendTag(tag)}
                    style={[styles.tagPill, used && styles.tagPillUsed]}>
                    <Text style={[styles.tagPillText, used && styles.tagPillTextUsed]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.fieldLabel}>Add a photo (optional)</Text>
            {photoUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                <Pressable onPress={() => setPhotoUri(null)} style={styles.photoRemove}>
                  <X size={16} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={showPhotoPicker} style={styles.photoZone}>
                <Camera size={24} color={TERRACOTTA} strokeWidth={2} />
                <Text style={styles.photoZoneText}>Add photo of your bag</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  centered: {
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    backgroundColor: TERRACOTTA,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnSpacer: {
    width: 36,
    height: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 28,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  summaryImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  summaryImagePlaceholder: {
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryEmoji: {
    fontSize: 24,
  },
  summaryCenter: {
    flex: 1,
    minWidth: 0,
  },
  summaryPartner: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  summaryBag: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  summaryPickup: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  summaryRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  summaryPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: TERRACOTTA,
  },
  summaryPaid: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  formSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 420,
  },
  ratingSection: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ratingSubtitle: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  starTouch: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
  },
  miniSection: {
    marginTop: 8,
  },
  miniSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  miniRow: {
    marginBottom: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  miniRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniIcon: {
    fontSize: 16,
  },
  miniLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  miniPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  miniPill: {
    backgroundColor: BG,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  miniPillActive: {
    backgroundColor: TERRACOTTA,
  },
  miniPillText: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '500',
  },
  miniPillTextActive: {
    color: '#FFFFFF',
  },
  commentSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  commentInput: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    textAlignVertical: 'top',
  },
  commentInputFocused: {
    borderColor: TERRACOTTA,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
  tagsRow: {
    gap: 8,
    paddingTop: 12,
    paddingRight: 8,
  },
  tagPill: {
    backgroundColor: '#FAECE7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagPillUsed: {
    backgroundColor: '#E5E7EB',
  },
  tagPillText: {
    fontSize: 12,
    color: '#993C1D',
    fontWeight: '600',
  },
  tagPillTextUsed: {
    color: '#9CA3AF',
  },
  photoSection: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  photoZone: {
    height: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#F0997B',
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoZoneText: {
    fontSize: 13,
    color: TERRACOTTA,
    fontWeight: '500',
  },
  photoPreviewWrap: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FAECE7',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#F0EDE8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  submitBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: TERRACOTTA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#F0EDE8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtnTextDisabled: {
    color: '#9CA3AF',
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  backLinkText: {
    color: TERRACOTTA,
    fontWeight: '600',
  },
  successScreen: {
    flex: 1,
    backgroundColor: TERRACOTTA,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  successPartner: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 20,
  },
  successStars: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
  },
  successBtn: {
    marginTop: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  successBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
