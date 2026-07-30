import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Clock, MapPin } from 'lucide-react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';
import { formatDistance, getDistanceColor, isTooFarToReserve } from '@/lib/distance';
import { formatBagPickupLabel } from '@/lib/helpers';
import { getRescueBagImageUrl } from '@/lib/images';
import type { HomeBag } from '@/store/useBagsStore';

type ExploreBagListCardProps = {
  bag: HomeBag;
  title: string;
  priceLabel: string;
  onPress: () => void;
  onPartnerPress: () => void;
  selected?: boolean;
};

export function ExploreBagListCard({
  bag,
  title,
  priceLabel,
  onPress,
  onPartnerPress,
  selected = false,
}: ExploreBagListCardProps) {
  const remaining = Math.max(0, bag.quantity_available - bag.quantity_reserved);
  const tooFar = isTooFarToReserve(bag.distance_km);
  const distanceColor =
    bag.distance_km != null ? getDistanceColor(bag.distance_km) : Palette.textTertiary;
  const pickupLabel = formatBagPickupLabel(bag.available_date, bag.pickup_start, bag.pickup_end);
  const savingsPct =
    bag.original_price > 0
      ? Math.round(((bag.original_price - bag.rescue_price) / bag.original_price) * 100)
      : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        tooFar && styles.cardTooFar,
        pressed && styles.pressed,
      ]}>
      <View style={styles.thumbWrap}>
        <AppImage
          source={{ uri: getRescueBagImageUrl(bag, 'thumb') }}
          style={styles.thumb}
          recyclingKey={bag.id}
        />
        {savingsPct > 0 ? (
          <View style={styles.savingsChip}>
            <Text style={styles.savingsText}>-{savingsPct}%</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.copy}>
        <Pressable onPress={onPartnerPress} hitSlop={6}>
          <Text numberOfLines={1} style={styles.partner}>
            {bag.partner.name}
          </Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={11} color={distanceColor} strokeWidth={2.4} />
            <Text style={[styles.meta, { color: distanceColor }]}>
              {bag.distance_km == null ? 'Nearby' : formatDistance(bag.distance_km)}
            </Text>
          </View>
          <Text style={styles.metaDot}>·</Text>
          <View style={styles.metaItem}>
            <Clock size={11} color={Palette.textTertiary} strokeWidth={2.4} />
            <Text style={styles.meta} numberOfLines={1}>
              {pickupLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.stock}>{remaining} left today</Text>
      </View>

      <View style={styles.trailing}>
        <Text style={styles.price}>{priceLabel}</Text>
        <ChevronRight
          size={16}
          color={selected ? Palette.primary : Palette.textTertiary}
          strokeWidth={2.5}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
  },
  cardSelected: {
    borderColor: Palette.primaryMid,
    backgroundColor: Palette.primaryLight,
  },
  cardTooFar: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.92,
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Palette.imagePlaceholder,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  savingsChip: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  savingsText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.white,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  partner: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  title: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  meta: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  metaDot: {
    ...Type.label,
    color: Palette.textTertiary,
  },
  stock: {
    ...Type.label,
    color: Palette.success,
    fontWeight: '600',
    marginTop: 1,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 8,
    paddingRight: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primaryDark,
    letterSpacing: -0.3,
  },
});
