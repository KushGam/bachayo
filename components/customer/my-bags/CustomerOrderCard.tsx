import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Lock,
  MapPin,
  Star,
  Store,
  X,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { OrderShortCode } from '@/components/customer/OrderShortCode';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import type { CancellationEligibility } from '@/constants/cancellation';
import { formatNprPaisa } from '@/lib/helpers';
import { normalizeOrderStatus } from '@/lib/orderStatus';
import type { CustomerOrderWithDetails } from '@/types/app';

import { OrderStatusBadge } from './OrderStatusBadge';
import type { CustomerMyBagsTab } from './CustomerMyBagsHeader';

type CustomerOrderCardProps = {
  order: CustomerOrderWithDetails;
  tab: CustomerMyBagsTab;
  expanded: boolean;
  countdown: string;
  urgent: boolean;
  cancelEligibility: CancellationEligibility;
  showCancelRow: boolean;
  onToggleExpand: () => void;
  onCancelPress: () => void;
  onDirections: () => void;
  onReview: () => void;
  onHelp: () => void;
  onViewRestaurant: () => void;
};

export function CustomerOrderCard({
  order,
  tab,
  expanded,
  countdown,
  urgent,
  cancelEligibility,
  showCancelRow,
  onToggleExpand,
  onCancelPress,
  onDirections,
  onReview,
  onHelp,
  onViewRestaurant,
}: CustomerOrderCardProps) {
  const status = normalizeOrderStatus(order.status);
  const isActiveOrder = status === 'confirmed' || status === 'pending';
  const isPast = tab === 'past';
  const isCancelBlocked = cancelEligibility === 'blocked' || cancelEligibility === 'expired';

  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <View style={styles.accent} />

      <Pressable
        onPress={() => isActiveOrder && onToggleExpand()}
        style={({ pressed }) => [styles.row, pressed && isActiveOrder && styles.pressed]}>
        {isActiveOrder ? (
          <View style={styles.qrThumb}>
            <QRCode value={order.qr_code} size={48} color={Palette.primaryDark} />
          </View>
        ) : (
          <View style={[styles.qrThumb, styles.qrThumbMuted]}>
            {status === 'cancelled' || status === 'missed' ? (
              <X size={22} color={Palette.textTertiary} strokeWidth={2.5} />
            ) : (
              <Check size={22} color={Palette.success} strokeWidth={2.5} />
            )}
          </View>
        )}

        <View style={styles.body}>
          <Text style={[styles.partner, isPast && styles.muted]} numberOfLines={1}>
            {order.partner.name}
          </Text>
          <Text style={[styles.bagTitle, isPast && styles.muted]} numberOfLines={1}>
            {order.bag?.title ?? 'Rescue bag'}
          </Text>

          {isActiveOrder && countdown ? (
            <View style={styles.countdownRow}>
              <Clock size={12} color={urgent ? Palette.urgency : Palette.textTertiary} strokeWidth={2} />
              <Text style={[styles.countdown, urgent && styles.countdownUrgent]}>{countdown}</Text>
            </View>
          ) : null}

          <Text style={[styles.priceLine, isPast && styles.muted]}>
            {formatNprPaisa(order.total_price)} · Pay at pickup
          </Text>

          <OrderStatusBadge status={order.status} />
        </View>

        {isActiveOrder ? (
          expanded ? (
            <ChevronUp size={18} color={Palette.textTertiary} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={18} color={Palette.textTertiary} strokeWidth={2.5} />
          )
        ) : null}
      </Pressable>

      {expanded && isActiveOrder ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.expanded}>
          <View style={styles.qrPanel}>
            <QRCode value={order.qr_code} size={176} color={Palette.primaryDark} />
          </View>
          <OrderShortCode qrCode={order.qr_code} />
          <Text style={styles.scanHint}>Show this QR at pickup</Text>
          <Pressable onPress={onDirections} style={({ pressed }) => [styles.directionsBtn, pressed && styles.pressed]}>
            <MapPin size={15} color={Palette.primary} strokeWidth={2.2} />
            <Text style={styles.directionsText}>Get directions</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {showCancelRow ? (
        <View style={styles.cancelRow}>
          <View style={styles.cancelStatus}>
            {cancelEligibility === 'free' ? (
              <Text style={styles.cancelFree}>Free cancellation available</Text>
            ) : cancelEligibility === 'late' ? (
              <View style={styles.cancelMetaRow}>
                <AlertTriangle size={14} color={Palette.warning} strokeWidth={2} />
                <Text style={styles.cancelLate}>Late cancellation</Text>
              </View>
            ) : (
              <View style={styles.cancelMetaRow}>
                <Lock size={14} color={Palette.textTertiary} strokeWidth={2} />
                <Text style={styles.cancelBlocked}>Cannot cancel now</Text>
              </View>
            )}
          </View>

          {!isCancelBlocked ? (
            <Pressable onPress={onCancelPress} hitSlop={8}>
              <Text style={styles.cancelAction}>Cancel</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onHelp} hitSlop={8}>
              <Text style={styles.helpLink}>Need help?</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {tab === 'past' ? (
        <Pressable
          onPress={onViewRestaurant}
          style={({ pressed }) => [styles.viewRestaurantBtn, pressed && styles.pressed]}>
          <Store size={15} color={Palette.primary} strokeWidth={2.2} />
          <Text style={styles.viewRestaurantText}>View restaurant</Text>
          <ChevronRight size={16} color={Palette.textTertiary} strokeWidth={2.5} />
        </Pressable>
      ) : null}

      {tab === 'past' && status === 'picked_up' && !order.review ? (
        <Pressable onPress={onReview} style={({ pressed }) => [styles.reviewBtn, pressed && styles.pressed]}>
          <Star size={15} color={Palette.primary} strokeWidth={2.2} />
          <Text style={styles.reviewText}>Leave a review</Text>
        </Pressable>
      ) : null}

      {tab === 'past' && status === 'picked_up' && order.review ? (
        <View style={styles.reviewedPill}>
          <Check size={12} color={Palette.success} strokeWidth={2.5} />
          <Text style={styles.reviewedText}>Reviewed</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    marginBottom: Spacing.md,
    ...FloatingShadow,
  },
  cardPast: {
    opacity: 0.92,
    backgroundColor: Palette.background,
  },
  accent: {
    height: 3,
    backgroundColor: Palette.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  pressed: {
    opacity: 0.95,
  },
  qrThumb: {
    padding: 6,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  qrThumbMuted: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  partner: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  bagTitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  countdown: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  countdownUrgent: {
    color: Palette.urgency,
  },
  priceLine: {
    ...Type.caption,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  muted: {
    color: Palette.textSecondary,
  },
  expanded: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
    marginTop: -Spacing.xs,
    paddingTop: Spacing.md,
  },
  qrPanel: {
    padding: Spacing.md,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  scanHint: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  directionsText: {
    ...Type.caption,
    color: Palette.primary,
    fontWeight: '700',
  },
  cancelRow: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cancelStatus: {
    flex: 1,
  },
  cancelFree: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  cancelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelLate: {
    ...Type.label,
    color: Palette.warning,
    fontWeight: '600',
  },
  cancelBlocked: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  cancelAction: {
    ...Type.caption,
    color: Palette.danger,
    fontWeight: '600',
  },
  helpLink: {
    ...Type.caption,
    color: Palette.primary,
    fontWeight: '600',
  },
  viewRestaurantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
    paddingTop: Spacing.md,
  },
  viewRestaurantText: {
    flex: 1,
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  reviewText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  reviewedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Palette.successBg,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#C5D9CB',
  },
  reviewedText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.success,
  },
});
