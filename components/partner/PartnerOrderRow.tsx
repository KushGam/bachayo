import { QrCode } from 'lucide-react-native';
import { memo, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { SuccessToast } from '@/components/ui/SuccessToast';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { normalizeOrderStatus } from '@/lib/orderStatus';
import {
  formatNprPaisa,
  formatRelativeTime,
  formatTime12h,
  getInitials,
  getOrderShortCode,
} from '@/lib/helpers';
import { hapticButtonPress, hapticSuccess } from '@/lib/haptics';
import { confirmPartnerPickup } from '@/lib/orders';
import { celebrateMilestoneOnce } from '@/lib/partnerMilestones';
import { promptPartnerPickupConfirm } from '@/lib/partnerPickupUi';
import { getDisplayName, getDisplayPhone } from '@/lib/privacy';
import type { PartnerOrderWithCustomer } from '@/types/app';
import type { OrderStatus } from '@/types/database';

type PartnerOrderRowProps = {
  order: PartnerOrderWithCustomer;
  partnerName?: string;
  onMarkPickedUp?: (orderId: string) => void;
  onOrderPickedUp?: (orderId: string) => void;
  onPickupReverted?: (orderId: string) => void;
  onScan?: () => void;
  onOpenChat?: (orderId: string) => void;
  unreadMessages?: number;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Waiting',
  confirmed: 'Ready',
  picked_up: 'Picked up',
  cancelled: 'Cancelled',
  missed: 'Missed',
};

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: Palette.warningBg, text: Palette.warning },
  confirmed: { bg: Palette.warningBg, text: Palette.warning },
  picked_up: { bg: Palette.successBg, text: Palette.success },
  cancelled: { bg: Palette.surfaceMuted, text: Palette.textSecondary },
  missed: { bg: Palette.surfaceMuted, text: Palette.textSecondary },
};

function formatPickedUpTime(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const PartnerOrderRow = memo(function PartnerOrderRow({
  order,
  partnerName,
  onMarkPickedUp,
  onOrderPickedUp,
  onPickupReverted,
  onScan,
  onOpenChat,
  unreadMessages = 0,
}: PartnerOrderRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(order.status);
  const [showToast, setShowToast] = useState(false);
  const prevOrderStatusRef = useRef(order.status);

  useEffect(() => {
    const prev = normalizeOrderStatus(prevOrderStatusRef.current);
    const next = normalizeOrderStatus(order.status);
    setLocalStatus(order.status);
    if (prev !== 'picked_up' && next === 'picked_up' && onMarkPickedUp) {
      setExpanded(false);
      setShowToast(true);
    }
    prevOrderStatusRef.current = order.status;
  }, [onMarkPickedUp, order.status]);

  const customerName =
    getDisplayName(order.customer) ||
    order.customer_name ||
    'Customer';
  const phone = getDisplayPhone(order.customer);
  const normalizedStatus = normalizeOrderStatus(localStatus);
  const statusStyle = STATUS_STYLES[normalizedStatus] ?? STATUS_STYLES.pending;
  const isCancelled = normalizedStatus === 'cancelled' || normalizedStatus === 'missed';
  const isPickedUp = normalizedStatus === 'picked_up';
  const canExpand = !isCancelled && !isPickedUp && normalizedStatus === 'confirmed';
  const serviceType = ((order as { service_type?: 'takeaway' | 'dinein' }).service_type ??
    'takeaway') as 'takeaway' | 'dinein';

  const runConfirm = async (allowOutsideWindow = false) => {
    if (isPickedUp) return;

    setLoading(true);

    const result = await confirmPartnerPickup(order, 'partner_manual', partnerName, {
      allowOutsideWindow,
    });
    setLoading(false);

    if (!result.ok) {
      Alert.alert('Error', result.errorMessage ?? 'Failed to update. Please try again.');
      return;
    }

    onOrderPickedUp?.(order.id);
    setLocalStatus('picked_up');
    setExpanded(false);
    if (!result.alreadyPickedUp) {
      void hapticSuccess();
      void celebrateMilestoneOnce('pickupConfirmed');
      setShowToast(true);
    }
  };

  const confirmFromDashboard = () => {
    void hapticButtonPress();
    if (onMarkPickedUp) {
      onMarkPickedUp(order.id);
      return;
    }
    promptPartnerPickupConfirm(order, (allowOutsideWindow) => {
      void runConfirm(allowOutsideWindow);
    });
  };

  const pickupWindow = `${formatTime12h(order.bag.pickup_start)} – ${formatTime12h(order.bag.pickup_end)}`;

  return (
    <View style={[styles.wrap, isPickedUp && styles.wrapDone]}>
      <SuccessToast
        visible={showToast}
        title="Pickup confirmed! ✓"
        onHide={() => setShowToast(false)}
      />

      <Pressable
        onPress={() => {
          if (canExpand) {
            void hapticButtonPress();
            setExpanded((value) => !value);
          }
        }}
        android_ripple={null}
        style={({ pressed }) => [
          styles.card,
          isCancelled && styles.cardCancelled,
          isPickedUp && styles.cardDone,
          pressed && canExpand && { opacity: 0.96 },
        ]}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(customerName)}</Text>
          </View>

          <View style={styles.content}>
            <Text numberOfLines={1} style={styles.customerName}>
              {customerName}
            </Text>
            <View
              style={[
                styles.serviceBadge,
                serviceType === 'dinein' ? styles.serviceBadgeDinein : styles.serviceBadgeTakeaway,
              ]}>
              <Text
                style={[
                  styles.serviceBadgeText,
                  serviceType === 'dinein'
                    ? styles.serviceBadgeTextDinein
                    : styles.serviceBadgeTextTakeaway,
                ]}>
                {serviceType === 'dinein' ? 'Prepare: Dine-in' : 'Prepare: Takeaway'}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.bagTitle}>
              {order.bag.title} · {pickupWindow}
            </Text>
            {isPickedUp && order.picked_up_at ? (
              <Text style={styles.pickedUpMeta}>
                Picked up at {formatPickedUpTime(order.picked_up_at)}
              </Text>
            ) : null}
            {isCancelled ? (
              <Text style={styles.cancelledNote}>Slot freed — {customerName} cancelled</Text>
            ) : null}
          </View>

          <View style={styles.right}>
            <Text style={styles.price}>{formatNprPaisa(order.total_price)}</Text>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                {STATUS_LABELS[normalizedStatus]}
              </Text>
            </View>
          </View>
        </View>

        {expanded && normalizedStatus === 'confirmed' ? (
          <View style={styles.expanded}>
            <Text style={styles.detailName}>{customerName}</Text>
            {phone ? (
              <Pressable onPress={() => void Linking.openURL(`tel:${phone}`)}>
                <Text style={styles.detailPhone}>{phone}</Text>
              </Pressable>
            ) : (
              <Text style={styles.phoneHidden}>📵 Phone hidden by customer</Text>
            )}
            {order.customer_note ? (
              <Text style={styles.detailNote}>{order.customer_note}</Text>
            ) : null}
            <Text style={styles.detailMeta}>Reserved {formatRelativeTime(order.created_at)}</Text>

            <View style={styles.qrBlock}>
              <View style={styles.qrWrap}>
                <QRCode value={order.qr_code} size={80} color={Palette.primary} />
              </View>
              <Text style={styles.codeLabel}>Code: {getOrderShortCode(order.qr_code)}</Text>
            </View>

            <View style={styles.paymentReminder}>
              <Text style={styles.paymentReminderText}>
                Collect {formatNprPaisa(order.total_price)} before handing over
              </Text>
            </View>

            <Text style={styles.pickupMeta}>Pickup {pickupWindow}</Text>

            <View style={styles.actionRow}>
              {onScan ? (
                <Pressable
                  onPress={() => {
                    void hapticButtonPress();
                    onScan();
                  }}
                  style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.9 }]}>
                  <QrCode size={15} color={Palette.textPrimary} strokeWidth={2} />
                  <Text style={styles.scanBtnText}>Scan QR</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={confirmFromDashboard}
                disabled={loading}
                style={({ pressed }) => [
                  styles.pickupBtn,
                  !onScan && styles.pickupBtnFull,
                  loading && { opacity: 0.6 },
                  pressed && !loading && { opacity: 0.92 },
                ]}>
                <Text style={styles.pickupBtnText}>
                  {loading ? 'Updating…' : 'Confirm pickup'}
                </Text>
              </Pressable>
            </View>
            {onOpenChat ? (
              <Pressable
                onPress={() => onOpenChat(order.id)}
                style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.9 }]}>
                <Text style={styles.chatBtnText}>💬 Message customer</Text>
                {unreadMessages > 0 ? (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>{unreadMessages}</Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.sm,
  },
  wrapDone: {
    opacity: 0.55,
  },
  card: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    ...FloatingShadow,
  },
  cardCancelled: {
    opacity: 0.5,
  },
  cardDone: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primaryLight,
  },
  avatarText: {
    color: Palette.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  bagTitle: {
    ...Type.label,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  pickedUpMeta: {
    ...Type.label,
    color: Palette.success,
    marginTop: 2,
    fontWeight: '500',
  },
  cancelledNote: {
    ...Type.label,
    color: Palette.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  serviceBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  serviceBadgeTakeaway: {
    backgroundColor: '#F5F3EF',
  },
  serviceBadgeDinein: {
    backgroundColor: '#FAECE7',
  },
  serviceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  serviceBadgeTextTakeaway: {
    color: Palette.textSecondary,
  },
  serviceBadgeTextDinein: {
    color: '#993C1D',
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  price: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    ...Type.label,
    fontWeight: '600',
  },
  expanded: {
    paddingTop: Spacing.md + 2,
    marginTop: Spacing.md + 2,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
    gap: 6,
  },
  detailName: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  detailPhone: {
    ...Type.caption,
    color: Palette.textSecondary,
    textDecorationLine: 'underline',
  },
  phoneHidden: {
    ...Type.caption,
    color: Palette.textTertiary,
    fontStyle: 'italic',
    fontSize: 13,
  },
  detailNote: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontStyle: 'italic',
  },
  detailMeta: {
    ...Type.label,
    color: Palette.textTertiary,
    marginBottom: Spacing.sm,
  },
  qrBlock: {
    alignItems: 'center',
    gap: 6,
    marginVertical: Spacing.sm,
  },
  qrWrap: {
    padding: Spacing.sm,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.md,
  },
  codeLabel: {
    ...Type.label,
    color: Palette.textSecondary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  paymentReminder: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  paymentReminderText: {
    ...Type.label,
    color: Palette.primaryDark,
    textAlign: 'center',
    fontWeight: '600',
  },
  pickupMeta: {
    ...Type.label,
    color: Palette.textSecondary,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  scanBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  scanBtnText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  pickupBtn: {
    flex: 2,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupBtnFull: {
    flex: 1,
  },
  pickupBtnText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.white,
  },
  chatBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Palette.primary,
    borderRadius: Radius.pill,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chatBtnText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
  chatBadge: {
    position: 'absolute',
    right: 10,
    top: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chatBadgeText: {
    color: Palette.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
