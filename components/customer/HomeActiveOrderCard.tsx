import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppSymbol } from '@/components/ui/AppSymbol';
import { Palette } from '@/constants/Colors';
import { FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatNprPaisa, getPickupCountdownLabel } from '@/lib/helpers';
import type { CustomerOrderWithDetails } from '@/types/app';

type HomeActiveOrderCardProps = {
  order: CustomerOrderWithDetails;
  locale: 'en' | 'np';
  onPress: () => void;
};

export function HomeActiveOrderCard({ order, locale, onPress }: HomeActiveOrderCardProps) {
  const countdown = getPickupCountdownLabel(order.bag.available_date, order.bag.pickup_end);
  const pickupWindow = `${order.bag.pickup_start.slice(0, 5)} – ${order.bag.pickup_end.slice(0, 5)}`;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={[Palette.primaryDark, Palette.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, FloatingShadow]}>
        <View style={styles.badge}>
          <AppSymbol ios="clock.fill" android="schedule" size={13} color={Palette.primaryDark} />
          <Text style={styles.badgeText}>
            {locale === 'np' ? 'आजको पिकअप' : "Today's pickup"}
          </Text>
        </View>

        <Text numberOfLines={1} style={styles.partner}>
          {order.partner.name}
        </Text>
        <Text numberOfLines={1} style={styles.bagTitle}>
          {locale === 'np' && order.bag.title_np ? order.bag.title_np : order.bag.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{pickupWindow}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.meta}>Qty {order.quantity}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.meta}>{formatNprPaisa(order.total_price)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.countdown}>{countdown}</Text>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{locale === 'np' ? 'QR हेर्नुहोस्' : 'View pickup QR'}</Text>
            <AppSymbol ios="qrcode" android="qr-code" size={16} color={Palette.primaryDark} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.94,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
  },
  badgeText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  partner: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.white,
    marginTop: Spacing.xs,
  },
  bagTitle: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  meta: {
    ...Type.label,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '600',
  },
  metaDot: {
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  countdown: {
    ...Type.caption,
    fontWeight: '700',
    color: '#FFD8A8',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  ctaText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
});
