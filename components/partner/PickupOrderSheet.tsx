import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatNprPaisa,
  formatRelativeTime,
  formatTime12h,
  getInitials,
  getOrderShortCode,
} from '@/lib/helpers';
import { hapticMedium } from '@/lib/haptics';
import type { PartnerOrderWithCustomer } from '@/types/app';

const TERRACOTTA = '#D85A30';
const GREEN = '#10B981';

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
    order.customer_name || order.customer.full_name || order.customer.phone || 'Customer';
  const phone = order.customer_phone || order.customer.phone;
  const pickupWindow = `${formatTime12h(order.bag.pickup_start)} – ${formatTime12h(order.bag.pickup_end)}`;
  const alreadyPickedUp = order.status === 'picked_up';

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
              {phone ? (
                <Pressable onPress={() => void Linking.openURL(`tel:${phone}`)}>
                  <Text style={styles.customerPhone}>{phone}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          <DetailRow label="🛍 Bag" value={order.bag.title} />
          <DetailRow label="₨ Amount" value={formatNprPaisa(order.total_price)} valueColor={TERRACOTTA} />
          <DetailRow label="🕐 Pickup" value={pickupWindow} />
          <DetailRow label="📅 Reserved" value={formatRelativeTime(order.created_at)} />
          <DetailRow label="🔢 Code" value={getOrderShortCode(order.qr_code)} />

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
              (confirming || alreadyPickedUp) && styles.confirmBtnDisabled,
              pressed && !confirming && !alreadyPickedUp && { transform: [{ scale: 0.97 }] },
            ]}>
            <Text style={styles.confirmBtnText}>
              {alreadyPickedUp
                ? 'Already picked up'
                : confirming
                  ? 'Confirming…'
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
    textDecorationLine: 'underline',
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
  confirmBtn: {
    backgroundColor: GREEN,
    borderRadius: 999,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
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
