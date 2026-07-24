import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, MapPin, Package } from 'lucide-react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';
import { formatDistance, getDistanceColor, isTooFarToReserve } from '@/lib/distance';
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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        tooFar && styles.cardTooFar,
        pressed && styles.pressed,
      ]}>
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
            <MapPin size={12} color={distanceColor} strokeWidth={2} />
            <Text style={[styles.meta, { color: distanceColor }]}>
              {bag.distance_km == null ? 'Nearby' : formatDistance(bag.distance_km)}
            </Text>
          </View>
          <Text style={styles.metaDot}>·</Text>
          <View style={styles.metaItem}>
            <Package size={12} color={Palette.textTertiary} strokeWidth={2} />
            <Text style={styles.meta}>{remaining} left</Text>
          </View>
        </View>
      </View>

      <View style={styles.trailing}>
        <Text style={styles.price}>{priceLabel}</Text>
        <ChevronRight size={16} color={Palette.textTertiary} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    padding: Spacing.md,
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
  copy: {
    flex: 1,
    gap: 3,
  },
  partner: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  title: {
    ...Type.caption,
    color: Palette.textSecondary,
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
  trailing: {
    alignItems: 'flex-end',
    gap: 6,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.primaryDark,
    letterSpacing: -0.3,
  },
});
