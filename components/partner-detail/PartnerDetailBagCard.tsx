import { Clock, ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import {
  formatBagPickupLabel,
  formatNprPaisa,
  getBagDineInExtraPaisa,
  getBagServiceType,
} from '@/lib/helpers';
import { formatNprFromPaisa } from '@/lib/partnerDetailUi';
import type { RescueBag } from '@/types/database';

type PartnerDetailBagCardProps = {
  bag: RescueBag;
  onReserve: () => void;
};

function serviceLabel(bag: RescueBag): string | null {
  const type = getBagServiceType(bag);
  const extra = getBagDineInExtraPaisa(bag);
  if (type === 'takeaway') return 'Takeaway';
  if (type === 'dinein') return extra > 0 ? `Dine-in · ${formatNprPaisa(extra)} extra` : 'Dine-in';
  if (extra > 0) return `Takeaway or dine-in · +${formatNprPaisa(extra)}`;
  return 'Takeaway or dine-in';
}

export function PartnerDetailBagCard({ bag, onReserve }: PartnerDetailBagCardProps) {
  const left = Math.max(0, bag.quantity_available - bag.quantity_reserved);
  const savings =
    bag.original_price > 0
      ? Math.round(((bag.original_price - bag.rescue_price) / bag.original_price) * 100)
      : 0;
  const service = serviceLabel(bag);

  return (
    <View style={styles.card}>
      {bag.image_url ? (
        <AppImage source={{ uri: bag.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <ShoppingBag size={28} color={Palette.primaryDark} strokeWidth={1.8} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {bag.title}
        </Text>
        {bag.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {bag.description}
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.rescuePrice}>{formatNprFromPaisa(bag.rescue_price)}</Text>
          <Text style={styles.originalPrice}>{formatNprFromPaisa(bag.original_price)}</Text>
          {savings > 0 ? <Text style={styles.savingsText}>{savings}% off</Text> : null}
        </View>

        {service ? <Text style={styles.serviceText}>{service}</Text> : null}

        <View style={styles.footer}>
          <View style={styles.metaBlock}>
            <View style={styles.metaItem}>
              <Clock size={12} color={Palette.textTertiary} strokeWidth={2} />
              <Text style={styles.metaText} numberOfLines={1}>
                {formatBagPickupLabel(bag.available_date, bag.pickup_start, bag.pickup_end)}
              </Text>
            </View>
            <Text style={[styles.stockText, left <= 3 && styles.stockLow]}>
              {left <= 3 ? `Only ${left} left` : `${left} left`}
            </Text>
          </View>

          <Pressable onPress={onReserve} style={styles.reserveBtn}>
            <Text style={styles.reserveBtnText}>Reserve</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  image: {
    width: 104,
    alignSelf: 'stretch',
    minHeight: 128,
  },
  imagePlaceholder: {
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  title: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  description: {
    ...Type.caption,
    color: Palette.textSecondary,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  rescuePrice: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: Palette.textTertiary,
    textDecorationLine: 'line-through',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.warning,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  metaBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Type.caption,
    color: Palette.textTertiary,
    flexShrink: 1,
  },
  stockText: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  stockLow: {
    color: Palette.amber,
    fontWeight: '700',
  },
  reserveBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexShrink: 0,
  },
  reserveBtnText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.white,
  },
});
