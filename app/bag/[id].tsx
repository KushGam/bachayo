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

import { AppImage } from '@/components/ui/AppImage';
import { Button } from '@/components/ui/Button';
import { BagCardSkeleton } from '@/components/ui/Skeleton';
import { RetryState } from '@/components/ui/RetryState';
import { Palette } from '@/constants/Colors';
import { Border, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { getRescueBagImageUrl } from '@/lib/images';
import { enrichBagsWithLiveStock } from '@/lib/bagStock';
import { formatNprPaisa, formatTime12h } from '@/lib/helpers';
import { findActiveReservationForBag } from '@/lib/reservations';
import { supabase } from '@/lib/supabase';
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
  const { id } = useLocalSearchParams<{ id: string }>();

  const [bag, setBag] = useState<RescueBagWithPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [existingOrder, setExistingOrder] = useState<ExistingReservation | null>(null);

  const remaining = useMemo(() => {
    if (!bag) return 0;
    return Math.max(0, bag.quantity_available - bag.quantity_reserved);
  }, [bag]);

  const maxQty = useMemo(() => {
    if (!bag) return 1;
    return Math.max(1, Math.min(3, remaining));
  }, [bag, remaining]);

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

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <AppImage
            source={{ uri: getRescueBagImageUrl(bag) }}
            style={styles.heroImage}
            aspectRatio={16 / 9}
          />
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.heroBack, pressed && { opacity: 0.85 }]}>
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
          <Text style={styles.rescuePrice}>{formatNprPaisa(bag.rescue_price)}</Text>
        </View>

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
              {remaining} left today
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

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.stickyBar}>
        <Text style={styles.stickyPrice}>{formatNprPaisa(bag.rescue_price)}</Text>
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
          <Pressable
            onPress={() => router.push(`/reserve/${bag.id}`)}
            style={({ pressed }) => [styles.reserveBtn, pressed && { opacity: 0.92 }]}>
            <Text style={styles.reserveBtnText}>Reserve this bag →</Text>
          </Pressable>
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
    top: Spacing.md,
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
    padding: Spacing.lg,
    backgroundColor: Palette.background,
    borderTopWidth: Border.width,
    borderTopColor: Palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    ...FloatingShadow,
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
});
