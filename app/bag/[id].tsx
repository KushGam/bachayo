import { AppSymbol } from '@/components/ui/AppSymbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppImage } from '@/components/ui/AppImage';
import { Button } from '@/components/ui/Button';
import { BagCardSkeleton } from '@/components/ui/Skeleton';
import { RetryState } from '@/components/ui/RetryState';
import { Palette } from '@/constants/Colors';
import { Border, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { getRescueBagImageUrl } from '@/lib/images';
import { enrichBagsWithLiveStock } from '@/lib/bagStock';
import { formatNprPaisa, formatTime12h, getBagDineInExtraPaisa, getBagServiceType } from '@/lib/helpers';
import {
  calculateDistance,
  formatDistance,
  getDistanceColor,
  isTooFarToReserve,
  MAX_RESERVE_DISTANCE_KM,
} from '@/lib/distance';
import { findActiveReservationForBag } from '@/lib/reservations';
import { supabase } from '@/lib/supabase';
import { useLocationStore } from '@/store/useLocationStore';
import type { RescueBagWithPartner } from '@/types/app';

type ExistingReservation = {
  id: string;
};

function maybeGetCategoryBundle(category: string) {
  switch (category) {
    case 'bakery':
      return 'Bread, pastries, sandwiches';
    case 'restaurant':
      return 'Dal bhat, curry, rice, snacks';
    case 'cafe':
      return 'Sandwiches, coffee, baked goods';
    case 'hotel':
      return 'Buffet items, curries, rice, desserts';
    case 'mart':
      return 'Ready-to-eat, snacks, groceries';
    default:
      return 'A tasty surprise mix';
  }
}

export default function RescueBagDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { latitude, longitude } = useLocationStore();

  const [bag, setBag] = useState<RescueBagWithPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedServiceType, setSelectedServiceType] = useState<'takeaway' | 'dinein'>('takeaway');
  const [existingOrder, setExistingOrder] = useState<ExistingReservation | null>(null);

  const remaining = useMemo(() => {
    if (!bag) return 0;
    return Math.max(0, bag.quantity_available - bag.quantity_reserved);
  }, [bag]);

  const maxQty = useMemo(() => {
    if (!bag) return 1;
    return Math.max(1, Math.min(bag.max_per_customer ?? 3, remaining));
  }, [bag, remaining]);

  const distanceKm = useMemo(() => {
    if (
      latitude == null ||
      longitude == null ||
      bag?.partner?.latitude == null ||
      bag?.partner?.longitude == null
    ) {
      return null;
    }
    return calculateDistance(
      latitude,
      longitude,
      bag.partner.latitude,
      bag.partner.longitude,
    );
  }, [bag?.partner?.latitude, bag?.partner?.longitude, latitude, longitude]);

  const tooFar = isTooFarToReserve(distanceKm);
  const hasLocation = latitude != null && longitude != null;

  useEffect(() => {
    setQuantity((q) => Math.min(q, maxQty));
  }, [maxQty]);

  useEffect(() => {
    if (!bag) return;
    const type = getBagServiceType(bag);
    if (type === 'dinein') setSelectedServiceType('dinein');
    else setSelectedServiceType('takeaway');
  }, [bag?.id]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from('rescue_bags')
        .select('*, partner:partners(*)')
        .eq('id', id)
        .maybeSingle();

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!error && data) {
        const bagData = data as unknown as RescueBagWithPartner;
        const [withStock] = await enrichBagsWithLiveStock([bagData]);
        setBag({ ...bagData, ...withStock });
        track('bag_viewed', { bag_id: id, partner_id: bagData.partner_id });

        if (userId) {
          const active = await findActiveReservationForBag(userId, id);
          setExistingOrder(active ? { id: active.id } : null);
        } else {
          setExistingOrder(null);
        }
      } else if (error) {
        setFetchError(error.message);
      }
      setLoading(false);
    })();
  }, [id, reloadKey]);

  const savings = useMemo(() => {
    if (!bag) return null;
    const save = Math.max(0, bag.original_price - bag.rescue_price);
    const pct = bag.original_price > 0 ? Math.round((save / bag.original_price) * 100) : 0;
    return { save, pct };
  }, [bag]);

  if (loading && !bag) {
    return (
      <View style={styles.loadingWrap}>
        <StatusBar style="dark" />
        <BagCardSkeleton />
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.loadingWrap}>
        <StatusBar style="dark" />
        <RetryState message={fetchError} onRetry={() => setReloadKey((k) => k + 1)} />
      </View>
    );
  }

  if (!bag) {
    return (
      <View style={styles.loadingWrap}>
        <StatusBar style="dark" />
        <Text style={styles.loadingText}>Bag not found</Text>
        <Button label="Go back" onPress={() => router.back()} fullWidth={false} />
      </View>
    );
  }

  const pickupStart = bag.pickup_start.slice(0, 5);
  const pickupEnd = bag.pickup_end.slice(0, 5);
  const pickupLabel = `Pickup ${formatTime12h(bag.pickup_start)}–${formatTime12h(bag.pickup_end)} today`;
  const soldOut = remaining <= 0;
  const bagServiceType = getBagServiceType(bag);
  const dineInExtra = getBagDineInExtraPaisa(bag);
  const canChooseService = bagServiceType === 'both';
  const unitPrice =
    selectedServiceType === 'dinein' ? bag.rescue_price + dineInExtra : bag.rescue_price;
  const stickyTotal = unitPrice * quantity;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <AppImage
            source={{ uri: getRescueBagImageUrl(bag, 'hero') }}
            style={styles.heroImage}
            aspectRatio={16 / 9}
            priority="high"
          />
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.heroBack,
              { top: Math.max(insets.top, Spacing.md) },
              pressed && { opacity: 0.85 },
            ]}>
            <AppSymbol ios="chevron.left" android="arrow-back" size={20} color={Palette.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.partnerRow}>
          <Pressable
            onPress={() => router.push(`/partner/${bag.partner_id}`)}
            style={({ pressed }) => [styles.partnerRowInner, pressed && { opacity: 0.92 }]}>
            <View style={styles.partnerLogo}>
              <Text style={styles.partnerLogoText}>
                {(bag.partner.name?.[0] || 'B').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.partnerName}>{bag.partner.name}</Text>
              <View style={styles.partnerMetaRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{bag.partner.category}</Text>
                </View>
                <View style={styles.ratingRow}>
                  <AppSymbol ios="star.fill" android="star" size={14} color={Palette.amber} />
                  <Text style={styles.ratingText}>{bag.partner.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>{bag.title}</Text>
          {bag.description ? <Text style={styles.description}>{bag.description}</Text> : null}

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>What you might get</Text>
            <Text style={styles.infoValue}>{maybeGetCategoryBundle(bag.partner.category)}</Text>
          </View>

          <View style={styles.infoRow}>
            <AppSymbol ios="clock" android="schedule" size={18} color={Palette.primary} />
            <Text style={styles.infoRowText}>
              Pickup: {pickupStart} – {pickupEnd}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <AppSymbol ios="mappin.and.ellipse" android="place" size={18} color={Palette.primary} />
            <Text style={styles.infoRowText}>{bag.partner.address || 'Address not set'}</Text>
          </View>

          {Platform.OS !== 'web' ? (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>Map preview needs a development build</Text>
            </View>
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>Map preview available on iOS & Android</Text>
            </View>
          )}
        </View>

        <View style={styles.priceBlock}>
          <View style={styles.priceTop}>
            <Text style={styles.originalPrice}>{formatNprPaisa(bag.original_price)}</Text>
            {savings ? (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>
                  You save ₨{Math.round(savings.save / 100)} ({savings.pct}%)
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rescuePrice}>{formatNprPaisa(unitPrice)}</Text>
          {canChooseService ? (
            <View style={styles.serviceWrap}>
              <Text style={styles.serviceChooserLabel}>How do you want it?</Text>
              <View style={styles.serviceChooserRow}>
                <Pressable
                  onPress={() => setSelectedServiceType('takeaway')}
                  style={[
                    styles.serviceChoice,
                    selectedServiceType === 'takeaway' && styles.serviceChoiceActive,
                  ]}>
                  <Text style={styles.serviceChoiceEmoji}>🛍</Text>
                  <Text
                    style={[
                      styles.serviceChoiceTitle,
                      selectedServiceType === 'takeaway' && styles.serviceChoiceTitleActive,
                    ]}>
                    Takeaway
                  </Text>
                  <Text
                    style={[
                      styles.serviceChoicePrice,
                      selectedServiceType === 'takeaway' && styles.serviceChoicePriceActive,
                    ]}>
                    {formatNprPaisa(bag.rescue_price)}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedServiceType('dinein')}
                  style={[
                    styles.serviceChoice,
                    selectedServiceType === 'dinein' && styles.serviceChoiceActive,
                  ]}>
                  <Text style={styles.serviceChoiceEmoji}>🍽</Text>
                  <Text
                    style={[
                      styles.serviceChoiceTitle,
                      selectedServiceType === 'dinein' && styles.serviceChoiceTitleActive,
                    ]}>
                    Dine-in
                  </Text>
                  <Text
                    style={[
                      styles.serviceChoicePrice,
                      selectedServiceType === 'dinein' && styles.serviceChoicePriceActive,
                    ]}>
                    {formatNprPaisa(bag.rescue_price + dineInExtra)}
                  </Text>
                  {dineInExtra > 0 ? (
                    <Text style={styles.serviceChoiceHint}>
                      +{formatNprPaisa(dineInExtra)} dine-in
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            </View>
          ) : bagServiceType === 'takeaway' ? (
            <View style={styles.serviceWrap}>
              <View style={styles.servicePillMuted}>
                <Text style={styles.servicePillMutedText}>🛍 Takeaway only</Text>
              </View>
            </View>
          ) : bagServiceType === 'dinein' ? (
            <View style={styles.serviceWrap}>
              <View style={styles.servicePillDinein}>
                <Text style={styles.servicePillDineinText}>
                  🍽 Dine-in
                  {dineInExtra > 0 ? ` · ${formatNprPaisa(bag.rescue_price + dineInExtra)}` : ' only'}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.qtyRow}>
            <Pressable
              disabled={quantity <= 1}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={[styles.qtyPill, quantity <= 1 && styles.qtyPillDisabled]}>
              <Text style={styles.qtyText}>−</Text>
            </Pressable>
            <View style={[styles.qtyPill, styles.qtyPillActive]}>
              <Text style={[styles.qtyText, styles.qtyTextActive]}>{quantity}</Text>
            </View>
            <Pressable
              disabled={quantity >= maxQty}
              onPress={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              style={[styles.qtyPill, quantity >= maxQty && styles.qtyPillDisabled]}>
              <Text style={styles.qtyText}>+</Text>
            </Pressable>
            <Text style={styles.qtyHint}>
              {remaining} left · max {bag.max_per_customer ?? 3} per customer
            </Text>
          </View>
          {soldOut ? (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutBadgeText}>Sold out</Text>
            </View>
          ) : remaining === 1 ? (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockBadgeText}>Only 1 left!</Text>
            </View>
          ) : remaining <= 3 ? (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockBadgeText}>Only {remaining} left!</Text>
            </View>
          ) : null}
        </View>

        <View style={{ height: 132 + insets.bottom }} />
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        {tooFar && distanceKm != null && !existingOrder && !soldOut ? (
          <View style={styles.tooFarCard}>
            <Text style={styles.tooFarEmoji}>📍</Text>
            <Text style={styles.tooFarTitle}>Too far to reserve</Text>
            <Text style={styles.tooFarBody}>
              You're {formatDistance(distanceKm)} away. LastBag reservations are only available
              within {MAX_RESERVE_DISTANCE_KM}km of the restaurant.
            </Text>
            <View style={styles.tooFarDistanceRow}>
              <Text style={styles.tooFarDistanceMuted}>Your distance:</Text>
              <Text style={styles.tooFarDistanceValue}>{formatDistance(distanceKm)}</Text>
              <Text style={styles.tooFarDistanceMuted}>
                · Limit: {MAX_RESERVE_DISTANCE_KM}km
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.tooFarCta, pressed && { opacity: 0.9 }]}
              onPress={() => router.push('/(tabs)/customer/home')}>
              <Text style={styles.tooFarCtaText}>Find bags near me →</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.stickyLeft}>
              <Text style={styles.stickyPrice}>{formatNprPaisa(stickyTotal)}</Text>
              {!soldOut && !existingOrder ? (
                <Text style={styles.stickyHint}>
                  {selectedServiceType === 'dinein' ? 'Dine-in' : 'Takeaway'}
                  {quantity > 1 ? ` · ×${quantity}` : ''}
                </Text>
              ) : null}
            </View>
            {existingOrder ? (
              <Pressable
                onPress={() => router.push(`/order/${existingOrder.id}`)}
                style={({ pressed }) => [styles.reservedCard, pressed && { opacity: 0.92 }]}>
                <View style={styles.reservedCheck}>
                  <Text style={styles.reservedCheckText}>✓</Text>
                </View>
                <View style={styles.reservedCopy}>
                  <Text style={styles.reservedTitle}>You already reserved this bag!</Text>
                  <Text style={styles.reservedSubtitle}>{pickupLabel}</Text>
                </View>
                <Text style={styles.reservedLink}>View →</Text>
              </Pressable>
            ) : soldOut ? (
              <View style={styles.soldOutBtn}>
                <Text style={styles.soldOutBtnText}>Sold out</Text>
              </View>
            ) : (
              <View style={styles.reserveWrap}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/reserve/[bagId]',
                      params: {
                        bagId: bag.id,
                        qty: String(quantity),
                        service: selectedServiceType,
                      },
                    })
                  }
                  style={({ pressed }) => [styles.reserveBtn, pressed && { opacity: 0.92 }]}>
                  <Text style={styles.reserveBtnText}>Reserve this bag →</Text>
                </Pressable>
                {!hasLocation ? (
                  <Text style={styles.locationHint}>
                    Enable location to see distance from this restaurant
                  </Text>
                ) : distanceKm != null ? (
                  <Text style={[styles.locationHint, { color: getDistanceColor(distanceKm) }]}>
                    {formatDistance(distanceKm)}
                  </Text>
                ) : null}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingBottom: Spacing.lg,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  loadingText: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Palette.imagePlaceholder,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBack: {
    position: 'absolute',
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: Border.width,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  partnerRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  partnerLogo: {
    width: 46,
    height: 46,
    borderRadius: Radius.pill,
    backgroundColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerLogoText: {
    color: Palette.primary,
    ...Type.h2,
  },
  partnerName: {
    color: Palette.textPrimary,
    ...Type.h2,
  },
  partnerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: Border.width,
    borderColor: Palette.border,
  },
  categoryBadgeText: {
    color: Palette.primaryDark,
    ...Type.label,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    color: Palette.textSecondary,
    ...Type.caption,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Type.h1,
    color: Palette.textPrimary,
    marginBottom: Spacing.xs,
  },
  description: {
    ...Type.body,
    color: Palette.textSecondary,
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
    ...FloatingShadow,
  },
  infoLabel: {
    ...Type.label,
    color: Palette.textSecondary,
  },
  infoValue: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoRowText: {
    ...Type.bodyMedium,
    color: Palette.textPrimary,
    flex: 1,
  },
  mapThumbWrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: Border.width,
    borderColor: Palette.border,
    marginTop: Spacing.sm,
  },
  mapThumb: {
    height: 140,
    width: '100%',
  },
  mapFallback: {
    marginTop: Spacing.sm,
    height: 120,
    borderRadius: Radius.lg,
    backgroundColor: Palette.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFallbackText: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
  },
  priceBlock: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 20,
    backgroundColor: Palette.white,
    gap: Spacing.sm,
    ...FloatingShadow,
  },
  priceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  originalPrice: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
    textDecorationLine: 'line-through',
  },
  rescuePrice: {
    ...Type.display,
    color: Palette.primary,
  },
  saveBadge: {
    backgroundColor: Palette.lightGreenBg,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  saveBadgeText: {
    color: Palette.primaryDark,
    ...Type.label,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: Spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPillActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  qtyPillDisabled: {
    opacity: 0.35,
  },
  qtyText: {
    ...Type.h2,
    color: Palette.textSecondary,
  },
  qtyTextActive: {
    color: Palette.white,
  },
  qtyHint: {
    marginLeft: Spacing.sm,
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  soldOutBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  soldOutBadgeText: {
    ...Type.label,
    color: '#6B7280',
    fontWeight: '700',
  },
  lowStockBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  lowStockBadgeText: {
    ...Type.label,
    color: '#92400E',
    fontWeight: '700',
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Palette.background,
    borderTopWidth: Border.width,
    borderTopColor: Palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    ...FloatingShadow,
  },
  stickyLeft: {
    flexShrink: 0,
  },
  stickyHint: {
    ...Type.label,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  reservedCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  reservedCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reservedCheckText: {
    color: Palette.white,
    fontSize: 18,
    fontWeight: '700',
  },
  reservedCopy: {
    flex: 1,
    gap: 2,
  },
  reservedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  reservedSubtitle: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  reservedLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primary,
  },
  soldOutBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  soldOutBtnText: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: '#6B7280',
  },
  stickyPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.primary,
    letterSpacing: -0.4,
  },
  reserveBtn: {
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  reserveBtnText: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.white,
  },
  reserveWrap: {
    flex: 1,
  },
  locationHint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  tooFarCard: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  tooFarEmoji: {
    fontSize: 28,
  },
  tooFarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
    textAlign: 'center',
    marginTop: 8,
  },
  tooFarBody: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    opacity: 0.85,
  },
  tooFarDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: Palette.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tooFarDistanceMuted: {
    fontSize: 12,
    color: '#6B7280',
  },
  tooFarDistanceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  tooFarCta: {
    marginTop: 12,
    backgroundColor: '#D85A30',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tooFarCtaText: {
    color: Palette.white,
    fontWeight: '700',
    fontSize: 13,
  },
  serviceWrap: {
    marginTop: Spacing.md,
  },
  serviceChooserLabel: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
    marginBottom: Spacing.sm,
  },
  serviceChooserRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  serviceChoice: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  serviceChoiceActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primaryLight,
  },
  serviceChoiceEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  serviceChoiceTitle: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  serviceChoiceTitleActive: {
    color: Palette.primaryDark,
  },
  serviceChoicePrice: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginTop: 2,
  },
  serviceChoicePriceActive: {
    color: Palette.primary,
  },
  serviceChoiceHint: {
    fontSize: 10,
    color: Palette.textTertiary,
    marginTop: 2,
  },
  servicePillMuted: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  servicePillMutedText: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  servicePillDinein: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  servicePillDineinText: {
    fontSize: 12,
    color: Palette.primaryDark,
    fontWeight: '600',
  },
});
