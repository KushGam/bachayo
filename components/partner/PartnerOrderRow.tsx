import { memo, useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { SuccessToast } from '@/components/ui/SuccessToast';
import { Palette } from '@/constants/Colors';
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
import type { PartnerOrderWithCustomer } from '@/types/app';
import type { OrderStatus } from '@/types/database';

type PartnerOrderRowProps = {
  order: PartnerOrderWithCustomer;
  partnerName?: string;
  onPickupComplete?: () => void;
  onOrderPickedUp?: (orderId: string) => void;
  onScan?: () => void;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Waiting',
  confirmed: 'Confirmed',
  picked_up: 'Done ✓',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#FAECE7', text: Palette.primaryDark },
  confirmed: { bg: '#FAECE7', text: Palette.primaryDark },
  picked_up: { bg: '#ECFDF5', text: '#065F46' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
};

const AVATAR_COLORS = ['#D85A30', '#993C1D', '#B45309', '#065F46', '#1D4ED8', '#7C3AED'];

function avatarColor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatPickedUpTime(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const PartnerOrderRow = memo(function PartnerOrderRow({
  order,
  partnerName,
  onPickupComplete,
  onOrderPickedUp,
  onScan,
}: PartnerOrderRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(order.status);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setLocalStatus(order.status);
  }, [order.status]);

  const customerName =
    order.customer_name || order.customer.full_name || order.customer.phone || 'Customer';
  const phone = order.customer_phone || order.customer.phone;
  const normalizedStatus = normalizeOrderStatus(localStatus);
  const statusStyle = STATUS_STYLES[normalizedStatus] ?? STATUS_STYLES.pending;
  const isCancelled = normalizedStatus === 'cancelled';
  const isPickedUp = normalizedStatus === 'picked_up';
  const canExpand = !isCancelled && !isPickedUp && normalizedStatus === 'confirmed';

  const runConfirm = async () => {
    setLoading(true);
    const result = await confirmPartnerPickup(order, 'partner_manual', partnerName);
    setLoading(false);

    if (!result.ok) {
      Alert.alert('Error', 'Failed to update. Try again.');
      return;
    }

    setLocalStatus('picked_up');
    setExpanded(false);
    onOrderPickedUp?.(order.id);
    void hapticSuccess();
    void celebrateMilestoneOnce('pickupConfirmed');
    setShowToast(true);
    onPickupComplete?.();
  };

  const confirmFromDashboard = () => {
    void hapticButtonPress();
    Alert.alert(
      'Confirm pickup',
      'Has this customer collected their bag and paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, confirmed ✓',
          onPress: () => void runConfirm(),
        },
      ],
    );
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
          <View style={[styles.avatar, { backgroundColor: avatarColor(customerName) }]}>
            <Text style={styles.avatarText}>{getInitials(customerName)}</Text>
          </View>

          <View style={styles.content}>
            <Text numberOfLines={1} style={styles.customerName}>
              {customerName}
            </Text>
            <Text numberOfLines={1} style={styles.bagTitle}>
              {order.bag.title}
            </Text>
            <Text style={styles.meta}>Reserved {formatRelativeTime(order.created_at)}</Text>
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
            ) : null}
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
                💵 Collect {formatNprPaisa(order.total_price)} before handing over
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
                  <Text style={styles.scanBtnText}>📷 Scan QR</Text>
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
                  {loading ? 'Updating…' : '✓ Mark as picked up'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  wrapDone: {
    opacity: 0.6,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  cardCancelled: {
    opacity: 0.5,
  },
  cardDone: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bagTitle: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  meta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  pickedUpMeta: {
    fontSize: 12,
    color: '#065F46',
    marginTop: 2,
    fontWeight: '500',
  },
  cancelledNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expanded: {
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    gap: 6,
  },
  detailName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  detailPhone: {
    fontSize: 13,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  detailNote: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  detailMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  qrBlock: {
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  qrWrap: {
    padding: 8,
    backgroundColor: '#FAECE7',
    borderRadius: 12,
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  paymentReminder: {
    backgroundColor: '#FAECE7',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  paymentReminderText: {
    fontSize: 12,
    color: '#993C1D',
    textAlign: 'center',
  },
  pickupMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  scanBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  pickupBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupBtnFull: {
    flex: 1,
  },
  pickupBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
