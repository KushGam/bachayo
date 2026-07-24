import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerDetailAbout } from '@/components/partner-detail/PartnerDetailAbout';
import { PartnerDetailBagsSection } from '@/components/partner-detail/PartnerDetailBagsSection';
import { PartnerDetailHero } from '@/components/partner-detail/PartnerDetailHero';
import { PartnerDetailInfoCard } from '@/components/partner-detail/PartnerDetailInfoCard';
import { PartnerDetailPayments } from '@/components/partner-detail/PartnerDetailPayments';
import { PartnerDetailReviewsSection } from '@/components/partner-detail/PartnerDetailReviewsSection';
import { PartnerDetailSkeleton } from '@/components/partner-detail/PartnerDetailSkeleton';
import { PartnerDetailStickyBar } from '@/components/partner-detail/PartnerDetailStickyBar';
import { RetryState } from '@/components/ui/RetryState';
import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';
import { haversineDistanceKm, normalizeNepalCoords } from '@/lib/helpers';
import { hapticButtonPress } from '@/lib/haptics';
import { isPartnerApproved } from '@/lib/partnerApproval';
import { decodePartnerMeta, getPartnerBio } from '@/lib/partnerMeta';
import { isReviewEligibleOrderStatus } from '@/lib/orderStatus';
import {
  fetchPartnerDetail,
  type PartnerDetailData,
} from '@/lib/partnerDetail';
import {
  formatNprFromPaisa,
  formatPartnerDistanceKm,
  formatPhoneDisplay,
  shortLocationLabel,
} from '@/lib/partnerDetailUi';
import { formatOpeningHours } from '@/lib/partnerProfile';
import { supabase } from '@/lib/supabase';

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
        Alert.alert('Not available', 'This restaurant is not yet available on LastBag.', [
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
  }, [id, router]);

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
        // Fall through to profile home location
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
      message: `Check out ${partner.name} on LastBag!${priceLine} 🛍 lastbag.app`,
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
        contentContainerStyle={{ paddingBottom: bags.length > 0 ? 120 : Spacing.xl }}
        showsVerticalScrollIndicator={false}>
        <PartnerDetailHero
          partner={partner}
          stats={stats}
          distanceLabel={distanceLabel}
          paddingTop={insets.top + Spacing.md}
          onBack={() => router.back()}
          onShare={() => void sharePartner()}
        />

        <PartnerDetailInfoCard
          locationLabel={locationLabel}
          hours={hours}
          phone={phone ? formatPhoneDisplay(phone) : null}
          onOpenMaps={openMaps}
          onCall={handleCall}
        />

        <PartnerDetailAbout text={bio} />

        <PartnerDetailBagsSection
          bags={bags}
          onLayout={(y) => {
            bagsSectionY.current = y;
          }}
          onReserve={(bagId) => {
            void hapticButtonPress();
            router.push(`/reserve/${bagId}`);
          }}
        />

        <PartnerDetailPayments methods={acceptedPayments} />

        <PartnerDetailReviewsSection
          stats={stats}
          reviews={reviews}
          visibleReviews={visibleReviews}
          showAllReviews={showAllReviews}
          reviewEligibility={reviewEligibility}
          onShowAll={() => setShowAllReviews(true)}
          onWriteReview={(orderId) => router.push(`/review/${orderId}`)}
        />
      </ScrollView>

      {bags.length > 0 && lowestPrice != null ? (
        <PartnerDetailStickyBar
          lowestPrice={lowestPrice}
          bagCount={bags.length}
          paddingBottom={insets.bottom + Spacing.md}
          onPress={handleStickyReserve}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  centered: {
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  scroll: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  backLink: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
  },
  backLinkText: {
    color: Palette.primary,
    fontWeight: '600',
  },
});
