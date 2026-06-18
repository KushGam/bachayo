import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { BagCardSkeleton } from '@/components/ui/Skeleton';
import { RetryState } from '@/components/ui/RetryState';
import { Palette } from '@/constants/Colors';
import { track } from '@/lib/analytics';
import { formatNprPaisa, parsePickupDateTimeLocal } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import type { RescueBagWithPartner } from '@/types/app';

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
    case 'dhaba':
      return 'Momo, chowmein, thukpa, snacks';
    case 'supermarket':
      return 'Ready-to-eat, salads, bakery items';
    default:
      return 'A tasty surprise mix';
  }
}

export default function RescueBagDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [bag, setBag] = useState<RescueBagWithPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const maxQty = useMemo(() => {
    if (!bag) return 1;
    const left = Math.max(0, bag.quantity_available - bag.quantity_reserved);
    return Math.max(1, Math.min(3, left));
  }, [bag]);

  useEffect(() => {
    setQuantity((q) => Math.min(q, maxQty));
  }, [maxQty]);

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

      if (!error && data) {
        const bagData = data as unknown as RescueBagWithPartner;
        setBag(bagData);
        track('bag_viewed', { bag_id: id, partner_id: bagData.partner_id });
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

  const totalRescuePrice = useMemo(() => {
    if (!bag) return 0;
    return bag.rescue_price * quantity;
  }, [bag, quantity]);

  if (loading && !bag) {
    return (
      <View style={styles.loadingWrap}>
        <BagCardSkeleton />
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.loadingWrap}>
        <RetryState message={fetchError} onRetry={() => setReloadKey((k) => k + 1)} />
      </View>
    );
  }

  if (!bag) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Bag not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backFallback}>
          <Text style={styles.backFallbackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const pickupStart = bag.pickup_start.slice(0, 5);
  const pickupEnd = bag.pickup_end.slice(0, 5);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1) Hero image */}
        <View style={styles.heroWrap}>
          <Image
            source={{
              uri:
                bag.partner.cover_image_url ||
                'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=60',
            }}
            style={styles.heroImage}
          />
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.heroBack, pressed && { opacity: 0.85 }]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={Palette.textPrimary}
            />
          </Pressable>
        </View>

        {/* 2) Partner info row */}
        <View style={styles.partnerRow}>
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
                <SymbolView
                  name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                  size={14}
                  tintColor={Palette.amber}
                />
                <Text style={styles.ratingText}>{bag.partner.rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3) Bag info */}
        <View style={styles.section}>
          <Text style={styles.title}>{bag.title}</Text>
          {bag.description ? <Text style={styles.description}>{bag.description}</Text> : null}

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>What you might get</Text>
            <Text style={styles.infoValue}>{maybeGetCategoryBundle(bag.partner.category)}</Text>
          </View>

          <View style={styles.infoRow}>
            <SymbolView
              name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
              size={18}
              tintColor={Palette.primary}
            />
            <Text style={styles.infoRowText}>
              Pickup: {pickupStart} – {pickupEnd}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <SymbolView
              name={{ ios: 'mappin.and.ellipse', android: 'place', web: 'place' }}
              size={18}
              tintColor={Palette.primary}
            />
            <Text style={styles.infoRowText}>{bag.partner.address || 'Address not set'}</Text>
          </View>

          {/* Map thumbnail */}
          {Platform.OS !== 'web' ? (
            <View style={styles.mapThumbWrap}>
              <MapView
                style={styles.mapThumb}
                pointerEvents="none"
                region={{
                  latitude: bag.partner.latitude,
                  longitude: bag.partner.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}>
                <Marker
                  coordinate={{
                    latitude: bag.partner.latitude,
                    longitude: bag.partner.longitude,
                  }}
                />
              </MapView>
            </View>
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>Map preview available on iOS & Android</Text>
            </View>
          )}
        </View>

        {/* 4) Price block */}
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
          <Text style={styles.rescuePrice}>{formatNprPaisa(bag.rescue_price)}</Text>
        </View>

        {/* 5) Quantity selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.qtyRow}>
            {[1, 2, 3].map((q) => {
              const disabled = q > maxQty;
              const active = q === quantity;
              return (
                <Pressable
                  key={q}
                  disabled={disabled}
                  onPress={() => setQuantity(q)}
                  style={[
                    styles.qtyPill,
                    active && styles.qtyPillActive,
                    disabled && styles.qtyPillDisabled,
                  ]}>
                  <Text style={[styles.qtyText, active && styles.qtyTextActive]}>
                    {q}
                  </Text>
                </Pressable>
              );
            })}
            <Text style={styles.qtyHint}>
              {Math.max(0, bag.quantity_available - bag.quantity_reserved)} left today
            </Text>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* 6) Sticky bottom bar */}
      <View style={styles.stickyBar}>
        <Pressable
          onPress={() => router.push(`/checkout/new?bagId=${bag.id}&qty=${quantity}`)}
          style={({ pressed }) => [styles.reserveBtn, pressed && { opacity: 0.9 }]}>
          <Text style={styles.reserveBtnText}>Reserve for {formatNprPaisa(totalRescuePrice)}</Text>
        </Pressable>
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
    paddingBottom: 16,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    color: Palette.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  backFallback: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backFallbackText: {
    color: Palette.white,
    fontWeight: '700',
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Palette.lightGreenBg,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBack: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  partnerLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerLogoText: {
    color: Palette.primary,
    fontWeight: '900',
    fontSize: 18,
  },
  partnerName: {
    color: Palette.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  partnerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
  },
  categoryBadgeText: {
    color: Palette.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    color: Palette.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.textPrimary,
    marginBottom: 6,
  },
  description: {
    color: Palette.textMuted,
    fontSize: 14.5,
    lineHeight: 22,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 6,
  },
  infoLabel: {
    color: Palette.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
  },
  infoValue: {
    color: Palette.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoRowText: {
    color: Palette.textPrimary,
    fontSize: 14.5,
    fontWeight: '600',
    flex: 1,
  },
  mapThumbWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    marginTop: 10,
  },
  mapThumb: {
    height: 140,
    width: '100%',
  },
  mapFallback: {
    marginTop: 10,
    height: 120,
    borderRadius: 16,
    backgroundColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFallbackText: {
    color: Palette.textMuted,
    fontWeight: '600',
  },
  priceBlock: {
    marginTop: 18,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    gap: 10,
  },
  priceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  originalPrice: {
    color: Palette.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  rescuePrice: {
    color: Palette.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  saveBadge: {
    backgroundColor: Palette.lightGreenBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saveBadgeText: {
    color: Palette.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    color: Palette.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.white,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPillActive: {
    backgroundColor: Palette.lightGreenBg,
    borderColor: Palette.primary,
  },
  qtyPillDisabled: {
    opacity: 0.35,
  },
  qtyText: {
    color: Palette.textMuted,
    fontWeight: '900',
    fontSize: 16,
  },
  qtyTextActive: {
    color: Palette.primary,
  },
  qtyHint: {
    marginLeft: 8,
    color: Palette.textMuted,
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: Palette.background,
    borderTopWidth: 1,
    borderTopColor: Palette.lightGreenBg,
  },
  reserveBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '900',
  },
});

