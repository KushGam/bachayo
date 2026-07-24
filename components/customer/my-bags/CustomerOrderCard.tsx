import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  MapPin,
  MessageCircle,
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
import type { OrderServiceType } from '@/types/database';

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
  showPhoneToRestaurants?: boolean;
  onToggleExpand: () => void;
  onCancelPress: () => void;
  onDirections: () => void;
  onReview: () => void;
  onHelp: () => void;
  onViewRestaurant: () => void;
  onChat: () => void;
  onPrivacySettings?: () => void;
  onFindNearby?: () => void;
  unreadMessages: number;
};

function StatusGlyph({ status }: { status: string }) {
  const normalized = normalizeOrderStatus(status);
  if (normalized === 'picked_up') {
    return (
      <View style={[styles.statusGlyph, styles.statusGlyphSuccess]}>
        <Check size={20} color={Palette.success} strokeWidth={2.6} />
      </View>
    );
  }
  if (normalized === 'missed') {
    return (
      <View style={[styles.statusGlyph, styles.statusGlyphMissed]}>
        <X size={20} color="#B45309" strokeWidth={2.6} />
      </View>
    );
  }
  return (
    <View style={[styles.statusGlyph, styles.statusGlyphMuted]}>
      <X size={20} color={Palette.textTertiary} strokeWidth={2.6} />
    </View>
  );
}

export function CustomerOrderCard({
  order,
  tab,
  expanded,
  countdown,
  urgent,
  cancelEligibility,
  showCancelRow,
  showPhoneToRestaurants = true,
  onToggleExpand,
  onCancelPress,
  onDirections,
  onReview,
  onHelp,
  onViewRestaurant,
  onChat,
  onPrivacySettings,
  onFindNearby,
  unreadMessages,
}: CustomerOrderCardProps) {
  const status = normalizeOrderStatus(order.status);
  const isActiveOrder = status === 'confirmed' || status === 'pending';
  const isPast = tab === 'past';
  const isCancelBlocked = cancelEligibility === 'blocked' || cancelEligibility === 'expired';
  const serviceType = (order.service_type ?? 'takeaway') as OrderServiceType;
  const needsReview = isPast && status === 'picked_up' && !order.review;
  const hasReview = isPast && status === 'picked_up' && Boolean(order.review);
  const cancellationReason =
    (order as { cancellation_reason?: string | null }).cancellation_reason ?? null;
  const cancelledByPartner =
    status === 'cancelled' &&
    Boolean(cancellationReason?.toLowerCase().includes('partner cancelled'));

  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <Pressable
        onPress={() => isActiveOrder && onToggleExpand()}
        style={({ pressed }) => [styles.row, pressed && isActiveOrder && styles.pressed]}>
        {isActiveOrder ? (
          <View style={styles.qrThumb}>
            <QRCode value={order.qr_code} size={44} color={Palette.primaryDark} />
          </View>
        ) : (
          <StatusGlyph status={status} />
        )}

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.partner} numberOfLines={1}>
              {order.partner.name}
            </Text>
            <OrderStatusBadge status={order.status} cancellationReason={cancellationReason} />
          </View>

          <Text style={styles.bagTitle} numberOfLines={1}>
            {order.bag?.title ?? 'Rescue bag'}
          </Text>

          {cancelledByPartner ? (
            <Text style={styles.partnerCancelHint}>
              😔 This restaurant cancelled their bag.{' '}
              {onFindNearby ? (
                <Text style={styles.partnerCancelLink} onPress={onFindNearby}>
                  Find another bag nearby →
                </Text>
              ) : (
                'Find another bag nearby →'
              )}
            </Text>
          ) : null}
          {isActiveOrder && countdown ? (
            <View style={[styles.countdownRow, urgent && styles.countdownRowUrgent]}>
              <Clock
                size={12}
                color={urgent ? Palette.urgency : Palette.primary}
                strokeWidth={2.2}
              />
              <Text style={[styles.countdown, urgent && styles.countdownUrgent]}>{countdown}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>{formatNprPaisa(order.total_price)}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaChip}>{serviceType === 'dinein' ? 'Dine-in' : 'Takeaway'}</Text>
            {isActiveOrder ? (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.metaChipMuted}>Pay at pickup</Text>
              </>
            ) : null}
          </View>

          {isActiveOrder && !expanded ? (
            <Text style={styles.tapHint}>Tap to show QR code</Text>
          ) : null}
        </View>

        {isActiveOrder ? (
          <View style={styles.chevronWrap}>
            {expanded ? (
              <ChevronUp size={18} color={Palette.textTertiary} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={18} color={Palette.textTertiary} strokeWidth={2.5} />
            )}
          </View>
        ) : null}
      </Pressable>

      {expanded && isActiveOrder ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.expanded}>
          <View style={styles.qrPanel}>
            <QRCode value={order.qr_code} size={168} color={Palette.primaryDark} />
          </View>
          <OrderShortCode qrCode={order.qr_code} />
          <Text style={styles.scanHint}>Show this QR at the counter to confirm pickup</Text>
          <View style={styles.privacyRow}>
            <Text
              style={[
                styles.privacyText,
                !showPhoneToRestaurants && styles.privacyTextHidden,
              ]}>
              {showPhoneToRestaurants
                ? '📞 Restaurant can see your phone'
                : '🔒 Phone hidden from restaurant'}
            </Text>
            {onPrivacySettings ? (
              <Pressable onPress={onPrivacySettings} hitSlop={6}>
                <Text style={styles.privacyLink}>Change in Privacy settings →</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.chatRow}>
            <Pressable
              onPress={onChat}
              style={({ pressed }) => [
                styles.actionPill,
                styles.actionPillFlex,
                styles.actionPillPrimary,
                pressed && styles.pressed,
              ]}>
              <MessageCircle size={14} color={Palette.primaryDark} strokeWidth={2.2} />
              <Text style={styles.actionPillTextPrimary}>Message</Text>
              {unreadMessages > 0 ? <View style={styles.chatDot} /> : null}
            </Pressable>
            <Pressable
              onPress={onDirections}
              style={({ pressed }) => [
                styles.actionPill,
                styles.actionPillFlex,
                pressed && styles.pressed,
              ]}>
              <MapPin size={14} color={Palette.textPrimary} strokeWidth={2.2} />
              <Text style={styles.actionPillText}>Directions</Text>
            </Pressable>
          </View>
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
            <Pressable onPress={onCancelPress} hitSlop={8} style={styles.cancelBtn}>
              <Text style={styles.cancelAction}>Cancel</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onHelp} hitSlop={8}>
              <Text style={styles.helpLink}>Need help?</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {isPast ? (
        <View style={styles.pastFooter}>
          <View style={styles.pastActions}>
            <Pressable
              onPress={onViewRestaurant}
              style={({ pressed }) => [styles.actionPill, styles.actionPillFlex, pressed && styles.pressed]}>
              <Store size={14} color={Palette.textPrimary} strokeWidth={2.2} />
              <Text style={styles.actionPillText}>Restaurant</Text>
            </Pressable>

            {needsReview ? (
              <Pressable
                onPress={onReview}
                style={({ pressed }) => [
                  styles.actionPill,
                  styles.actionPillFlex,
                  styles.actionPillPrimary,
                  pressed && styles.pressed,
                ]}>
                <Star size={14} color={Palette.primaryDark} strokeWidth={2.2} />
                <Text style={styles.actionPillTextPrimary}>Leave review</Text>
              </Pressable>
            ) : null}
          </View>

          {hasReview && order.review ? (
            <View style={styles.reviewBlock}>
              <View style={styles.reviewedPill}>
                <Check size={12} color={Palette.success} strokeWidth={2.5} />
                <Text style={styles.reviewedText}>
                  You rated {order.review.rating}★
                  {order.review.comment
                    ? ` · “${order.review.comment.slice(0, 48)}${order.review.comment.length > 48 ? '…' : ''}”`
                    : ''}
                </Text>
              </View>
              {order.review.partner_reply ? (
                <View style={styles.partnerReplyBox}>
                  <Text style={styles.partnerReplyLabel}>Reply from {order.partner.name}</Text>
                  <Text style={styles.partnerReplyText}>{order.review.partner_reply}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
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
    backgroundColor: Palette.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  qrThumb: {
    width: 56,
    height: 56,
    padding: 6,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGlyph: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusGlyphSuccess: {
    backgroundColor: Palette.successBg,
    borderColor: '#C5D9CB',
  },
  statusGlyphMissed: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F5D98A',
  },
  statusGlyphMuted: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
  },
  body: {
    flex: 1,
    gap: 5,
    minWidth: 0,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partner: {
    flex: 1,
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  bagTitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  countdownRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  countdownRowUrgent: {
    backgroundColor: '#FEE2E2',
  },
  countdown: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  countdownUrgent: {
    color: Palette.urgency,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaChip: {
    ...Type.caption,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  metaChipMuted: {
    ...Type.caption,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Palette.borderSubtle,
  },
  tapHint: {
    ...Type.label,
    color: Palette.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  chevronWrap: {
    paddingTop: 18,
  },
  expanded: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
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
  privacyRow: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  privacyText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  privacyTextHidden: {
    color: '#10B981',
  },
  privacyLink: {
    fontSize: 11,
    color: '#D85A30',
    fontWeight: '600',
    textAlign: 'center',
  },
  partnerCancelHint: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  partnerCancelLink: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '700',
  },
  chatRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    position: 'relative',
  },
  actionPillFlex: {
    flex: 1,
  },
  actionPillPrimary: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
  },
  actionPillText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  actionPillTextPrimary: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  chatDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
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
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cancelAction: {
    ...Type.caption,
    color: Palette.danger,
    fontWeight: '700',
  },
  helpLink: {
    ...Type.caption,
    color: Palette.primary,
    fontWeight: '700',
  },
  pastFooter: {
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
    marginTop: 4,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: 10,
  },
  pastActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewBlock: {
    gap: 8,
  },
  reviewedPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Palette.successBg,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C5D9CB',
  },
  reviewedText: {
    flex: 1,
    ...Type.label,
    fontWeight: '600',
    color: Palette.success,
    lineHeight: 16,
  },
  partnerReplyBox: {
    backgroundColor: Palette.background,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: Palette.primary,
  },
  partnerReplyLabel: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primary,
    marginBottom: 4,
  },
  partnerReplyText: {
    ...Type.caption,
    color: Palette.textSecondary,
    lineHeight: 20,
  },
});
