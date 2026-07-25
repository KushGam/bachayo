import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatNprPaisa,
  formatRelativeTime,
  getInitials,
  getOrderShortCode,
} from '@/lib/helpers';
import { hapticMedium } from '@/lib/haptics';
import {
  formatPickupWindowRange,
  getOutsidePickupWindowCopy,
  getPickupWindowPhase,
} from '@/lib/pickupWindow';
import { getDisplayName, getDisplayPhone, getMaskedPhone } from '@/lib/privacy';
import type { PartnerOrderWithCustomer } from '@/types/app';

const TERRACOTTA = '#D85A30';
const GREEN = '#10B981';
const AMBER = '#B45309';

const AVATAR_COLORS = ['#D85A30', '#993C1D', '#B45309', '#065F46', '#1D4ED8', '#7C3AED'];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type PickupOrderSheetProps = {
  visible: boolean;
  order: PartnerOrderWithCustomer | null;
  confirming: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function PickupOrderSheet({
  visible,
  order,
  confirming,
  onConfirm,
  onDismiss,
}: PickupOrderSheetProps) {
  const insets = useSafeAreaInsets();

  if (!order) return null;

  const customerName =
    getDisplayName(order.customer) || order.customer_name || 'Customer';
  const displayPhone = getDisplayPhone(order.customer);
  const maskedPhone = displayPhone ? getMaskedPhone(displayPhone) : null;
  const pickupWindow = formatPickupWindowRange(order.bag.pickup_start, order.bag.pickup_end);
  const alreadyPickedUp = order.status === 'picked_up';
  const windowPhase = getPickupWindowPhase(
    order.bag.available_date,
    order.bag.pickup_start,
    order.bag.pickup_end,
  );
  const outsideWindow = windowPhase !== 'open';
  const overrideCopy = outsideWindow
    ? getOutsidePickupWindowCopy(windowPhase, order.bag.pickup_start, order.bag.pickup_end)
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.customerRow}>
            <View style={[styles.avatar, { backgroundColor: avatarColor(customerName) }]}>
              <Text style={styles.avatarText}>{getInitials(customerName)}</Text>
            </View>
            <View style={styles.customerCopy}>
              <Text style={styles.customerName}>{customerName}</Text>
              {maskedPhone ? (
                <Text style={styles.customerPhone}>{maskedPhone}</Text>
              ) : (
                <Text style={styles.phoneHidden}>📵 Phone hidden by customer</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <DetailRow label="🛍 Bag" value={order.bag.title} />
          <DetailRow label="₨ Amount" value={formatNprPaisa(order.total_price)} valueColor={TERRACOTTA} />
          <DetailRow
            label="🕐 Pickup"
            value={pickupWindow}
            valueColor={outsideWindow ? AMBER : undefined}
          />
          <DetailRow label="📅 Reserved" value={formatRelativeTime(order.created_at)} />
          <DetailRow label="🔢 Code" value={getOrderShortCode(order.qr_code)} />

          {overrideCopy ? (
            <View style={styles.windowWarning}>
              <Text style={styles.windowWarningBadge}>{overrideCopy.badge}</Text>
              <Text style={styles.windowWarningText}>{overrideCopy.body}</Text>
            </View>
          ) : null}

          <View style={styles.paymentReminder}>
            <Text style={styles.paymentReminderText}>
              💵 Collect {formatNprPaisa(order.total_price)} from customer before handing over the bag
            </Text>
          </View>

          <Pressable
            onPress={() => {
              void hapticMedium();
              onConfirm();
            }}
            disabled={confirming || alreadyPickedUp}
            style={({ pressed }) => [
              styles.confirmBtn,
              outsideWindow && !alreadyPickedUp && styles.confirmBtnOverride,
              (confirming || alreadyPickedUp) && styles.confirmBtnDisabled,
              pressed && !confirming && !alreadyPickedUp && { transform: [{ scale: 0.97 }] },
            ]}>
            <Text style={styles.confirmBtnText}>
              {alreadyPickedUp
                ? 'Already picked up'
                : confirming
                  ? 'Confirming…'
                  : overrideCopy
                    ? overrideCopy.confirmLabel
                    : '✓ Mark as picked up'}
            </Text>
          </Pressable>
          <Pressable onPress={onDismiss} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Wrong order — scan again</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  customerCopy: {
    flex: 1,
    gap: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  customerPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  phoneHidden: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1.2,
    textAlign: 'right',
  },
  paymentReminder: {
    backgroundColor: '#FAECE7',
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
  },
  paymentReminderText: {
    fontSize: 13,
    color: '#993C1D',
    textAlign: 'center',
    lineHeight: 20,
  },
  windowWarning: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 6,
  },
  windowWarningBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: AMBER,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  windowWarningText: {
    fontSize: 13,
    color: '#9A3412',
    lineHeight: 19,
  },
  confirmBtn: {
    backgroundColor: GREEN,
    borderRadius: 999,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnOverride: {
    backgroundColor: AMBER,
  },
  confirmBtnDisabled: {
    opacity: 0.55,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: TERRACOTTA,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
