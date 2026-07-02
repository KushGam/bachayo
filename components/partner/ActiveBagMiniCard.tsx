import { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { formatRsPaisa } from '@/lib/helpers';
import type { RescueBag } from '@/types/database';

type ActiveBagMiniCardProps = {
  bag: RescueBag;
  onPress?: () => void;
};

export const ActiveBagMiniCard = memo(function ActiveBagMiniCard({
  bag,
  onPress,
}: ActiveBagMiniCardProps) {
  const reserved = bag.quantity_reserved;
  const total = bag.quantity_available;
  const progress = total > 0 ? reserved / total : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}>
      <Text numberOfLines={2} style={styles.title}>
        {bag.title}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.rescuePrice}>{formatRsPaisa(bag.rescue_price)}</Text>
        <Text style={styles.originalPrice}>{formatRsPaisa(bag.original_price)}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {reserved} of {total} reserved
      </Text>

      <View style={styles.pickupPill}>
        <Text style={styles.pickupText}>
          {bag.pickup_start.slice(0, 5)} – {bag.pickup_end.slice(0, 5)}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 14,
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: '#F0EDE8',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 18,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  rescuePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: Palette.textSecondary,
    textDecorationLine: 'line-through',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0EDE8',
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  pickupPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAECE7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  pickupText: {
    fontSize: 11,
    color: Palette.primaryDark,
    fontWeight: '600',
  },
});
