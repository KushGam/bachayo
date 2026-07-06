import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { Palette } from '@/constants/Colors';
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';
import { getRescueBagImageUrl } from '@/lib/images';
import { formatBagPickupLabel, formatDistanceKm, formatNprPaisa, formatRsPaisa, getInitials } from '@/lib/helpers';
import { getCategoryPillLabel } from '@/constants/partnerCategories';
import { useAuthStore } from '@/store/useAuthStore';
import type { HomeBag } from '@/store/useBagsStore';

type RescueBagCardProps = {
  bag: HomeBag;
  onPress: () => void;
  onPartnerPress?: () => void;
  isReserved?: boolean;
};

export const RescueBagCard = memo(function RescueBagCard({
  bag,
  onPress,
  onPartnerPress,
  isReserved = false,
}: RescueBagCardProps) {
  const locale = useAuthStore((s) => s.locale);
  const left = Math.max(0, bag.quantity_available - bag.quantity_reserved);
  const soldOut = left <= 0;
  const displayTitle = locale === 'np' && bag.title_np ? bag.title_np : bag.title;
  const savingsPaisa = Math.max(0, bag.original_price - bag.rescue_price);
  const savingsPct =
    bag.original_price > 0
      ? Math.round((savingsPaisa / bag.original_price) * 100)
      : 0;
  const rating = bag.partner.rating ?? 0;
  const pickupLabel = formatBagPickupLabel(bag.available_date, bag.pickup_start, bag.pickup_end);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageCol}>
        <AppImage
          source={{ uri: getRescueBagImageUrl(bag) }}
          style={styles.image}
        />
        {savingsPct > 0 ? (
          <View style={styles.savingsChip}>
            <Text style={styles.savingsChipText}>-{savingsPct}%</Text>
          </View>
        ) : null}
        {isReserved ? (
          <View style={styles.reservedBadge}>
            <Text style={styles.reservedBadgeText}>Reserved ✓</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(bag.partner.name)}</Text>
          </View>
          <View style={styles.partnerMeta}>
            <Pressable onPress={onPartnerPress} disabled={!onPartnerPress} hitSlop={6}>
              <Text numberOfLines={1} style={styles.partnerName}>
                {bag.partner.name}
              </Text>
            </Pressable>
            <Text numberOfLines={1} style={styles.category}>
              {getCategoryPillLabel(bag.partner.category, locale)}
              {rating > 0 ? ` · ★ ${rating.toFixed(1)}` : ''}
            </Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.bagTitle}>
          {displayTitle}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <AppSymbol ios="clock" android="schedule" size={11} color={Palette.primary} />
            <Text style={styles.metaChipText}>{pickupLabel}</Text>
          </View>
          {bag.distance_km != null ? (
            <View style={styles.metaChip}>
              <AppSymbol ios="location" android="place" size={11} color={Palette.primary} />
              <Text style={styles.metaChipText}>
                {formatDistanceKm(bag.distance_km).replace(' away', '')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.rescuePrice}>{formatNprPaisa(bag.rescue_price)}</Text>
            {bag.original_price > bag.rescue_price ? (
              <Text style={styles.originalPrice}>
                {formatNprPaisa(bag.original_price)}
                {savingsPaisa > 0 ? ` · save ${formatRsPaisa(savingsPaisa)}` : ''}
              </Text>
            ) : null}
          </View>
          <View
            style={[
              styles.stockPill,
              soldOut && styles.stockPillSoldOut,
              !soldOut && left <= 3 && styles.stockPillLow,
            ]}>
            <Text
              style={[
                styles.stockText,
                soldOut && styles.stockTextSoldOut,
                !soldOut && left <= 3 && styles.stockTextLow,
              ]}>
              {soldOut ? 'Sold out' : left === 1 ? 'Only 1 left!' : left <= 3 ? `Only ${left} left!` : `${left} left`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    ...CardChrome,
    overflow: 'hidden',
    minHeight: 128,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  imageCol: {
    width: 112,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 132,
  },
  savingsChip: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  savingsChipText: {
    ...Type.label,
    color: Palette.white,
    fontWeight: '800',
  },
  reservedBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Palette.success,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  reservedBadgeText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.white,
  },
  body: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  partnerMeta: {
    flex: 1,
    gap: 1,
  },
  partnerName: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  category: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
  },
  bagTitle: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  metaChipText: {
    ...Type.label,
    color: Palette.primaryDark,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  rescuePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.primary,
    letterSpacing: -0.3,
  },
  originalPrice: {
    ...Type.label,
    color: Palette.textTertiary,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  stockPill: {
    backgroundColor: Palette.warningBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  stockPillLow: {
    backgroundColor: '#FEF3C7',
  },
  stockPillSoldOut: {
    backgroundColor: '#F3F4F6',
  },
  stockText: {
    ...Type.label,
    color: Palette.warning,
    fontWeight: '700',
  },
  stockTextLow: {
    color: '#92400E',
  },
  stockTextSoldOut: {
    color: '#6B7280',
  },
});
