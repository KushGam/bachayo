import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { formatDistanceKm, formatNprPaisa } from '@/lib/helpers';
import { useAuthStore } from '@/store/useAuthStore';
import type { HomeBag } from '@/store/useBagsStore';

type RescueBagCardProps = {
  bag: HomeBag;
  onPress: () => void;
};

export const RescueBagCard = memo(function RescueBagCard({ bag, onPress }: RescueBagCardProps) {
  const locale = useAuthStore((s) => s.locale);
  const left = Math.max(0, bag.quantity_available - bag.quantity_reserved);
  const displayTitle =
    locale === 'np' && bag.title_np ? bag.title_np : bag.title;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}>
      <Image
        source={{
          uri:
            bag.partner.cover_image_url ||
            'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=60',
        }}
        style={styles.cardImage}
      />

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text numberOfLines={1} style={styles.partnerName}>
            {bag.partner.name}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{bag.partner.category}</Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.bagTitle}>
          {displayTitle}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.originalPrice}>{formatNprPaisa(bag.original_price)}</Text>
          <Text style={styles.rescuePrice}>{formatNprPaisa(bag.rescue_price)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {bag.distance_km == null ? 'Distance unknown' : formatDistanceKm(bag.distance_km)}
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>
            {bag.pickup_start.slice(0, 5)} – {bag.pickup_end.slice(0, 5)}
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.leftText}>{left} left</Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Palette.lightGreenBg,
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partnerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  badge: {
    backgroundColor: Palette.lightGreenBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: Palette.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  bagTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  originalPrice: {
    fontSize: 14,
    color: Palette.textMuted,
    textDecorationLine: 'line-through',
  },
  rescuePrice: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaText: {
    fontSize: 12.5,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  metaDot: {
    color: Palette.textMuted,
    fontWeight: '700',
  },
  leftText: {
    fontSize: 12.5,
    color: Palette.amber,
    fontWeight: '800',
  },
});
