import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, Share2, Star } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerDetailSkeleton } from '@/components/partner-detail/PartnerDetailSkeleton';
import { AppImage } from '@/components/ui/AppImage';
import { RetryState } from '@/components/ui/RetryState';
import { getCategoryById } from '@/constants/partnerCategories';
import { getAreaById, getCityById } from '@/lib/locations';
import {
  fetchPartnerDetail,
  type PartnerDetailData,
  type PartnerReviewRow,
} from '@/lib/partnerDetail';
import { decodePartnerMeta, getPartnerBio } from '@/lib/partnerMeta';
import { isPartnerApproved } from '@/lib/partnerApproval';
import { isReviewEligibleOrderStatus } from '@/lib/orderStatus';
import { formatOpeningHours, formatPartnerLocationLabel } from '@/lib/partnerProfile';
import {
  formatRelativeTime,
  getInitials,
  haversineDistanceKm,
} from '@/lib/helpers';
import { hapticButtonPress } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useLocationStore } from '@/store/useLocationStore';
import type { RescueBag } from '@/types/database';

const TERRACOTTA = '#D85A30';
const BG = '#F5F3EF';
const MUTED = '#6B7280';

const AVATAR_COLORS = ['#D85A30', '#993C1D', '#B45309', '#065F46', '#1D4ED8', '#7C3AED'];

const PAYMENT_ICONS: Record<string, string> = {
  Cash: '💵',
  eSewa: '📱',
  Khalti: '💳',
  'Bank transfer': '🏦',
};

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatNprFromPaisa(paisa: number) {
  const amount = Math.round(paisa / 100).toLocaleString('en-NP');
  return `₨ ${amount}`;
}

/** Correct lat/lng stored swapped (common cause of ~9700 km distances in Nepal). */
function normalizeNepalCoords(latitude: number, longitude: number) {
  const latInNepal = latitude >= 26 && latitude <= 31;
  const lngInNepal = longitude >= 80 && longitude <= 89;
  const latLooksLikeLng = latitude >= 80 && latitude <= 89;
  const lngLooksLikeLat = longitude >= 26 && longitude <= 31;

  if (!latInNepal && latLooksLikeLng && lngLooksLikeLat) {
    return { latitude: longitude, longitude: latitude };
  }
  return { latitude, longitude };
}

function formatPartnerDistanceKm(distanceKm: number): string | null {
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 500) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m away`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km away`;
  return `${Math.round(distanceKm)} km away`;
}

function formatPhoneDisplay(phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('977')) digits = digits.slice(3);
  return digits || phone;
}

function shortLocationLabel(partner: PartnerDetailData['partner']) {
  const area = partner.area_id ? getAreaById(partner.area_id) : undefined;
  const city = partner.city_id ? getCityById(partner.city_id) : undefined;
  if (area && city) {
    const cityShort =
      city.id === 'kathmandu' ? 'KTM' : city.id === 'lalitpur' ? 'LTP' : city.name.slice(0, 3).toUpperCase();
    return `${area.name}, ${cityShort}`;
  }
  return formatPartnerLocationLabel(partner);
}

function formatPickupTime(start: string, end: string) {
  const fmt = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function StarRow({ rating, size = 14, color = TERRACOTTA }: { rating: number; size?: number; color?: string }) {
  const rounded = Math.round(rating);
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          color={color}
          fill={i < rounded ? color : 'transparent'}
          strokeWidth={2}
        />
      ))}
    </View>
  );
}

function AboutSection({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const height = useSharedValue(66);

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: height.value,
    overflow: 'hidden',
  }));

  const onTextLayout = (event: LayoutChangeEvent) => {
    if (!expanded && event.nativeEvent.layout.height > 66) {
      setTruncated(true);
    }
  };

  const toggle = () => {
    void hapticButtonPress();
    const next = !expanded;
    setExpanded(next);
    height.value = withTiming(next ? 500 : 66, { duration: 220 });
  };

  if (!text.trim()) return null;

  return (
    <View style={styles.aboutSection}>
      <Text style={styles.sectionTitle}>About</Text>
      <Animated.View style={animatedStyle}>
        <Text style={styles.aboutText} onLayout={onTextLayout}>
          {text}
        </Text>
      </Animated.View>
      {truncated || expanded ? (
        <Pressable onPress={toggle} hitSlop={8}>
          <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BagCard({ bag, onReserve }: { bag: RescueBag; onReserve: () => void }) {
  const left = Math.max(0, bag.quantity_available - bag.quantity_reserved);
  const savings =
    bag.original_price > 0
      ? Math.round(((bag.original_price - bag.rescue_price) / bag.original_price) * 100)
      : 0;

  return (
    <View style={styles.bagCard}>
      {bag.image_url ? (
        <AppImage source={{ uri: bag.image_url }} style={styles.bagImage} resizeMode="cover" />
      ) : (
        <View style={[styles.bagImage, styles.bagImagePlaceholder]}>
          <Text style={styles.bagPlaceholderEmoji}>🛍</Text>
        </View>
      )}

      <View style={styles.bagBody}>
        <Text style={styles.bagTitle} numberOfLines={2}>
          {bag.title}
        </Text>
        {bag.description ? (
          <Text style={styles.bagDescription} numberOfLines={2}>
            {bag.description}
          </Text>
        ) : null}

        <View style={styles.bagPriceRow}>
          <Text style={styles.bagRescuePrice}>{formatNprFromPaisa(bag.rescue_price)}</Text>
          <Text style={styles.bagOriginalPrice}>{formatNprFromPaisa(bag.original_price)}</Text>
          {savings > 0 ? (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>{savings}% off</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bagMetaRow}>
          <View style={styles.bagMetaItem}>
            <Clock size={12} color={MUTED} strokeWidth={2} />
            <Text style={styles.bagMetaText}>{formatPickupTime(bag.pickup_start, bag.pickup_end)}</Text>
          </View>
          {left <= 3 ? (
            <Text style={styles.bagLowStock}>Only {left} left!</Text>
          ) : (
            <Text style={styles.bagMetaText}>{left} left</Text>
          )}
        </View>

        <Pressable onPress={onReserve} style={styles.reserveBtn}>
          <Text style={styles.reserveBtnText}>Reserve</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ReviewCard({ review }: { review: PartnerReviewRow }) {
  const name = review.customer?.full_name || 'Customer';
  const bagTitle = review.order?.bag?.title ?? 'Rescue bag';

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <View style={[styles.reviewAvatar, { backgroundColor: avatarColor(name) }]}>
          <Text style={styles.reviewAvatarText}>{getInitials(name)}</Text>
        </View>
        <View style={styles.reviewCenter}>
          <Text style={styles.reviewName}>{name.split(' ')[0] ?? name}</Text>
          <Text style={styles.reviewTime}>{formatRelativeTime(review.created_at)}</Text>
        </View>
        <View style={styles.reviewRating}>
          <StarRow rating={review.rating} size={12} />
        </View>
      </View>
      {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
      <View style={styles.reviewBagPill}>
        <Text style={styles.reviewBagPillText}>🛍 {bagTitle}</Text>
      </View>
    </View>
  );
}

export default function PartnerDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const bagsSectionY = useRef(0);

  const [data, setData] = useState<PartnerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [reviewEligibility, setReviewEligibility] = useState<{
    eligibleOrderId: string | null;
    hasPickedUpOrder: boolean;
    hasReviewed: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setErrorText(null);
    setLoading(true);
    try {
      const detail = await fetchPartnerDetail(id);
      if (!isPartnerApproved(detail.partner)) {
        Alert.alert('Not available', 'This restaurant is not yet available on Bachayo.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        setData(null);
        return;
      }
      setData(detail);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to load partner');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      let coords: { latitude: number; longitude: number } | null = null;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        }
      } catch {
        // Fall through to profile / selected area
      }

      if (!coords) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('home_latitude, home_longitude')
            .eq('id', userId)
            .maybeSingle();
          if (profile?.home_latitude != null && profile?.home_longitude != null) {
            coords = {
              latitude: profile.home_latitude,
              longitude: profile.home_longitude,
            };
          }
        }
      }

      if (!coords) {
        const { cityId, areaId } = useLocationStore.getState();
        const area = getAreaById(areaId);
        const city = getCityById(cityId);
        if (area) {
          coords = { latitude: area.latitude, longitude: area.longitude };
        } else if (city) {
          coords = { latitude: city.latitude, longitude: city.longitude };
        }
      }

      setUserCoords(coords);
    })();
  }, []);

  useEffect(() => {
    if (!id) {
      setReviewEligibility(null);
      return;
    }

    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setReviewEligibility({
          eligibleOrderId: null,
          hasPickedUpOrder: false,
          hasReviewed: false,
        });
        return;
      }

      const [{ data: pickedUpOrders }, { data: customerReviews }] = await Promise.all([
        supabase
          .from('orders')
          .select('id, status')
          .eq('customer_id', userId)
          .eq('partner_id', id)
          .in('status', ['picked_up', 'confirmed']),
        supabase
          .from('reviews')
          .select('order_id')
          .eq('partner_id', id)
          .eq('customer_id', userId),
      ]);

      const reviewedIds = new Set((customerReviews ?? []).map((row) => row.order_id));
      const eligible = (pickedUpOrders ?? []).find(
        (order) => isReviewEligibleOrderStatus(order.status) && !reviewedIds.has(order.id),
      );

      setReviewEligibility({
        eligibleOrderId: eligible?.id ?? null,
        hasPickedUpOrder: (pickedUpOrders ?? []).length > 0,
        hasReviewed: (customerReviews ?? []).length > 0,
      });
    })();
  }, [id]);

  const partner = data?.partner ?? null;
  const bags = data?.bags ?? [];
  const reviews = data?.reviews ?? [];
  const stats = data?.stats;
  const meta = decodePartnerMeta(partner?.description);
  const bio = partner ? getPartnerBio(partner.description) : '';
  const category = partner ? getCategoryById(partner.category) : null;

  const distanceLabel = useMemo(() => {
    if (!partner || !userCoords) return null;
    const partnerCoords = normalizeNepalCoords(partner.latitude, partner.longitude);
    const km = haversineDistanceKm(userCoords, partnerCoords);
    return formatPartnerDistanceKm(km);
  }, [partner, userCoords]);

  const acceptedPayments =
    meta.accepted_payments && meta.accepted_payments.length > 0
      ? meta.accepted_payments
      : ['Cash'];

  const lowestPrice = useMemo(() => {
    if (bags.length === 0) return null;
    return Math.min(...bags.map((bag) => bag.rescue_price));
  }, [bags]);

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const openMaps = () => {
    if (!partner) return;
    const query = partner.address
      ? encodeURIComponent(partner.address)
      : `${partner.latitude},${partner.longitude}`;
    void Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const sharePartner = async () => {
    if (!partner) return;
    const priceLine = lowestPrice ? ` Rescue bags from ${formatNprFromPaisa(lowestPrice)}` : '';
    await Share.share({
      message: `Check out ${partner.name} on Bachayo!${priceLine} 🛍 bachayo.app`,
    });
  };

  const handleCall = () => {
    const callPhone = partner?.phone?.trim();
    if (!callPhone) {
      Alert.alert('No phone number listed', 'No phone number listed for this restaurant');
      return;
    }
    void Linking.openURL(`tel:${callPhone}`);
  };

  const scrollToBags = () => {
    scrollRef.current?.scrollTo({ y: bagsSectionY.current, animated: true });
  };

  const handleStickyReserve = () => {
    void hapticButtonPress();
    if (bags.length === 1) {
      router.push(`/reserve/${bags[0].id}`);
      return;
    }
    scrollToBags();
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <PartnerDetailSkeleton />
      </View>
    );
  }

  if (errorText || !partner || !stats) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <StatusBar style="dark" />
        <RetryState message={errorText ?? 'Partner not found'} onRetry={load} />
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const hours = formatOpeningHours(partner.description);
  const locationLabel = shortLocationLabel(partner);
  const phone = partner.phone?.trim();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bags.length > 0 ? 120 : 40 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {partner.cover_image_url ? (
            <AppImage source={{ uri: partner.cover_image_url }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderEmoji}>{category?.icon ?? '🍽'}</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            {category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {category.icon} {category.label}
                </Text>
              </View>
            ) : null}
            <Text style={styles.businessName}>{partner.name}</Text>
            <View style={styles.heroMetaRow}>
              {stats.avgRating > 0 ? (
                <>
                  <StarRow rating={stats.avgRating} size={12} color="#FFFFFF" />
                  <Text style={styles.heroRating}>{stats.avgRating.toFixed(1)}</Text>
                </>
              ) : null}
              <Text style={styles.heroMetaText}>
                · {stats.totalReviews} review{stats.totalReviews === 1 ? '' : 's'}
              </Text>
              {distanceLabel ? <Text style={styles.heroMetaText}> · {distanceLabel}</Text> : null}
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.back()}
          style={[styles.headerBtn, styles.headerBtnLeft, { top: insets.top + 12 }]}>
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
        <Pressable
          onPress={() => void sharePartner()}
          style={[styles.headerBtn, styles.headerBtnRight, { top: insets.top + 12 }]}>
          <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
        </Pressable>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Pressable style={styles.infoPill} onPress={openMaps}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {locationLabel}
              </Text>
            </Pressable>
            <View style={styles.infoDivider} />
            <View style={styles.infoPill}>
              <Text style={styles.infoIcon}>🕐</Text>
              <Text style={styles.infoLabel}>Hours</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {hours}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <Pressable style={styles.infoPill} onPress={handleCall}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={styles.infoLabel}>Call</Text>
              <Text style={[styles.infoValue, !phone && styles.infoValueMuted]} numberOfLines={2}>
                {phone ? formatPhoneDisplay(phone) : 'Not listed'}
              </Text>
            </Pressable>
          </View>
        </View>

        <AboutSection text={bio} />

        <View
          onLayout={(event) => {
            bagsSectionY.current = event.nativeEvent.layout.y;
          }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Today&apos;s rescue bags</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {bags.length} bag{bags.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          {bags.length === 0 ? (
            <View style={styles.noBagsCard}>
              <Text style={styles.noBagsTitle}>No rescue bags today</Text>
              <Text style={styles.noBagsSubtitle}>
                Check back later — bags usually appear between 5–9pm
              </Text>
            </View>
          ) : (
            bags.map((bag) => (
              <BagCard
                key={bag.id}
                bag={bag}
                onReserve={() => {
                  void hapticButtonPress();
                  router.push(`/reserve/${bag.id}`);
                }}
              />
            ))
          )}
        </View>

        <View style={styles.paymentsSection}>
          <Text style={styles.paymentsSectionTitle}>We accept</Text>
          <View style={styles.paymentRow}>
            {acceptedPayments.map((method) => (
              <View key={method} style={styles.paymentPill}>
                <Text style={styles.paymentPillText}>
                  {PAYMENT_ICONS[method] ?? '💳'} {method}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Reviews</Text>
            {stats.totalReviews > 0 ? (
              <Text style={styles.reviewsCountLabel}>{stats.totalReviews} reviews</Text>
            ) : null}
          </View>

          <View style={styles.ratingStrip}>
            {stats.totalReviews > 0 ? (
              <>
                <View style={styles.ratingStripLeft}>
                  <Text style={styles.ratingStripScore}>{stats.avgRating.toFixed(1)}</Text>
                  <StarRow rating={stats.avgRating} size={14} />
                  <Text style={styles.ratingStripCount}>{stats.totalReviews} reviews</Text>
                </View>
                <View style={styles.ratingStripRight}>
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
              <View style={styles.ratingStripEmpty}>
                <StarRow rating={0} size={18} />
                <Text style={styles.ratingStripEmptyTitle}>No reviews yet</Text>
                <Text style={styles.ratingStripEmptySubtitle}>
                  Be the first to rescue a bag and review!
                </Text>
              </View>
            )}
          </View>

          {reviewEligibility?.eligibleOrderId ? (
            <Pressable
              onPress={() => {
                void hapticButtonPress();
                router.push(`/review/${reviewEligibility.eligibleOrderId}`);
              }}
              style={styles.writeReviewBtn}>
              <Text style={styles.writeReviewBtnText}>⭐ Write a review</Text>
            </Pressable>
          ) : reviewEligibility ? (
            reviewEligibility.hasReviewed ? (
              <Text style={styles.reviewStatusReviewed}>✓ You reviewed this restaurant</Text>
            ) : (
              <Text style={styles.reviewStatusHint}>
                Reserve and pick up a bag to leave a review
              </Text>
            )
          ) : null}

          {reviews.length > 0 ? (
            <>
              {visibleReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {reviews.length > 3 && !showAllReviews ? (
                <Pressable
                  onPress={() => {
                    void hapticButtonPress();
                    setShowAllReviews(true);
                  }}
                  style={styles.seeAllReviews}>
                  <Text style={styles.seeAllReviewsText}>
                    See all {stats.totalReviews} reviews →
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      {bags.length > 0 && lowestPrice != null ? (
        <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 12 }]}>
          <View>
            <Text style={styles.stickyPrice}>From {formatNprFromPaisa(lowestPrice)}</Text>
            <Text style={styles.stickySub}>today only</Text>
          </View>
          <Pressable onPress={handleStickyReserve} style={styles.stickyBtn}>
            <Text style={styles.stickyBtnText}>
              {bags.length === 1 ? 'Reserve now →' : `See ${bags.length} bags →`}
            </Text>
          </Pressable>
        </View>
      ) : null}
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
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  hero: {
    height: 260,
    position: 'relative',
    backgroundColor: '#FAECE7',
  },
  heroImage: {
    width: '100%',
    height: 260,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderEmoji: {
    fontSize: 56,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  heroContent: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  businessName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  heroRating: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  headerBtn: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerBtnLeft: {
    left: 16,
  },
  headerBtnRight: {
    right: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  infoCard: {
    marginTop: -24,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoPill: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#F0EDE8',
    marginVertical: 2,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoLabel: {
    fontSize: 11,
    color: MUTED,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  infoValueMuted: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  aboutSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  readMore: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: TERRACOTTA,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionHeaderStandalone: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },
  countBadge: {
    backgroundColor: TERRACOTTA,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noBagsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  noBagsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  noBagsSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
  bagCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  bagImage: {
    width: 90,
    height: 90,
  },
  bagImagePlaceholder: {
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagPlaceholderEmoji: {
    fontSize: 28,
  },
  bagBody: {
    flex: 1,
    padding: 12,
    paddingRight: 88,
    minHeight: 90,
  },
  bagTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bagDescription: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED,
    lineHeight: 16,
  },
  bagPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  bagRescuePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: TERRACOTTA,
  },
  bagOriginalPrice: {
    fontSize: 13,
    color: MUTED,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    backgroundColor: '#FAEEDA',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  bagMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  bagMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  bagMetaText: {
    fontSize: 12,
    color: MUTED,
  },
  bagLowStock: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  reserveBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: TERRACOTTA,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  reserveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  paymentsSection: {
    marginTop: 20,
  },
  paymentsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  paymentPill: {
    backgroundColor: BG,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentPillText: {
    fontSize: 13,
    color: '#374151',
  },
  reviewsSection: {
    marginTop: 8,
  },
  reviewsCountLabel: {
    fontSize: 13,
    color: MUTED,
  },
  ratingStrip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingStripEmpty: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  ratingStripEmptyTitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
  },
  ratingStripEmptySubtitle: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    marginTop: 4,
  },
  writeReviewBtn: {
    alignSelf: 'center',
    backgroundColor: '#FAECE7',
    borderColor: '#F0997B',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  writeReviewBtnText: {
    color: TERRACOTTA,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewStatusHint: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  reviewStatusReviewed: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  ratingStripLeft: {
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
  ratingStripScore: {
    fontSize: 32,
    fontWeight: '700',
    color: TERRACOTTA,
  },
  ratingStripCount: {
    fontSize: 11,
    color: MUTED,
  },
  ratingStripRight: {
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
    fontSize: 11,
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
  noReviewsText: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCenter: {
    flex: 1,
    gap: 2,
  },
  reviewName: {
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
  },
  reviewComment: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  reviewBagPill: {
    alignSelf: 'flex-start',
    backgroundColor: BG,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  reviewBagPillText: {
    fontSize: 11,
    color: MUTED,
  },
  seeAllReviews: {
    marginTop: 8,
    marginBottom: 24,
  },
  seeAllReviewsText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: TERRACOTTA,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#F0EDE8',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  stickyPrice: {
    fontSize: 19,
    fontWeight: '700',
    color: TERRACOTTA,
  },
  stickySub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  stickyBtn: {
    backgroundColor: TERRACOTTA,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  stickyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  backLinkText: {
    color: TERRACOTTA,
    fontWeight: '600',
  },
});
