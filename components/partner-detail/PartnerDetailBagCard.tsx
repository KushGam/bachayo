import { Clock, ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatBagPickupLabel } from '@/lib/helpers';
import { formatNprFromPaisa } from '@/lib/partnerDetailUi';
import type { RescueBag } from '@/types/database';

type PartnerDetailBagCardProps = {
  bag: RescueBag;
  onReserve: () => void;
};

export function PartnerDetailBagCard({ bag, onReserve }: PartnerDetailBagCardProps) {
  const left = Math.max(0, bag.quantity_available - bag.quantity_reserved);
  const savings =
    bag.original_price > 0
      ? Math.round(((bag.original_price - bag.rescue_price) / bag.original_price) * 100)
      : 0;

  return (
    <View style={styles.card}>
      {bag.image_url ? (
        <AppImage source={{ uri: bag.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <ShoppingBag size={26} color={Palette.primaryDark} strokeWidth={1.8} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {bag.title}
        </Text>
        {bag.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {bag.description}
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.rescuePrice}>{formatNprFromPaisa(bag.rescue_price)}</Text>
          <Text style={styles.originalPrice}>{formatNprFromPaisa(bag.original_price)}</Text>
          {savings > 0 ? (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>{savings}% off</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={12} color={Palette.textTertiary} strokeWidth={2} />
            <Text style={styles.metaText}>
              {formatBagPickupLabel(bag.available_date, bag.pickup_start, bag.pickup_end)}
            </Text>
          </View>
          {left <= 3 ? (
            <Text style={styles.lowStock}>Only {left} left!</Text>
          ) : (
            <Text style={styles.metaText}>{left} left</Text>
          )}
        </View>

        <Pressable onPress={onReserve} style={styles.reserveBtn}>
          <Text style={styles.reserveBtnText}>Reserve</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  image: {
    width: 92,
    height: 92,
  },
  imagePlaceholder: {
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: Spacing.md,
    paddingRight: 88,
    minHeight: 92,
  },
  title: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  description: {
    marginTop: 2,
    ...Type.caption,
    color: Palette.textSecondary,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: 6,
  },
  rescuePrice: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.primary,
  },
  originalPrice: {
    ...Type.caption,
    color: Palette.textTertiary,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    backgroundColor: Palette.warningBg,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  savingsBadgeText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.warning,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    ...Type.caption,
    color: Palette.textTertiary,
  },
  lowStock: {
    ...Type.caption,
    color: Palette.amber,
    fontWeight: '700',
  },
  reserveBtn: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  reserveBtnText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.white,
  },
});
