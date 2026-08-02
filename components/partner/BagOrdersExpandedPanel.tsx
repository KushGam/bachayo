import { Phone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { EditOrderQtySheet } from '@/components/partner/EditOrderQtySheet';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { formatRelativeTime, getInitials } from '@/lib/helpers';
import { isConfirmedOrderStatus, isReservedOrderStatus, normalizeOrderStatus } from '@/lib/orderStatus';
import {
  getPartnerEditableOrderMaxQty,
  updatePartnerOrderQuantity,
} from '@/lib/orders';
import { formatNprFromPaisa, type PartnerBagOrder } from '@/lib/partnerBags';
import { getDisplayName, getDisplayPhone } from '@/lib/privacy';

type OrderSummaryInput = {
  quantity?: number;
  total_price?: number;
  status: string;
};

export function formatCollapsedOrdersSummary(
  orders: OrderSummaryInput[] | null | undefined,
  fallback?: { orderCount: number; bagCount: number; revenuePaisa: number },
): string {
  const active = (orders ?? []).filter((order) => isReservedOrderStatus(order.status));
  const hasOrders = active.length > 0;

  const totalOrders = hasOrders ? active.length : (fallback?.orderCount ?? 0);
  const totalBags = hasOrders
    ? active.reduce((sum, order) => sum + (order.quantity ?? 1), 0)
    : (fallback?.bagCount ?? 0);
  const totalRevenue = hasOrders
    ? active.reduce((sum, order) => sum + (order.total_price || 0), 0)
    : (fallback?.revenuePaisa ?? 0);

  if (totalOrders === 0) {
    return 'No active orders';
  }

  const revenueLabel = formatNprFromPaisa(totalRevenue);
  if (totalOrders === 1 && totalBags <= 1) {
    return `1 order · ${revenueLabel}`;
  }

  return `${totalOrders} orders · ${totalBags} bags · ${revenueLabel}`;
}

export function formatBagReservedProgressLabel(
  reserved: number,
  total: number,
  waitingCustomers: number,
): { text: string; color: string } {
  if (reserved === 0) {
    return {
      text: `${reserved} of ${total} bags reserved`,
      color: '#6B7280',
    };
  }

  const soldOut = total > 0 && reserved >= total;
  // quantity_reserved includes picked-up capacity; waitingCustomers is still awaiting.
  const text =
    waitingCustomers > 0
      ? soldOut
        ? `${reserved} of ${total} bags sold · ${waitingCustomers} waiting`
        : `${reserved} of ${total} bags reserved · ${waitingCustomers} waiting`
      : soldOut
        ? `${reserved} of ${total} bags sold`
        : `${reserved} of ${total} claimed · none waiting`;

  if (soldOut) {
    return { text, color: '#10B981' };
  }
  if (waitingCustomers > 0 && total > 0 && reserved / total > 0.5) {
    return { text, color: '#92400E' };
  }
  return { text, color: '#6B7280' };
}

function OrderSkeletonRow() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.skeletonRow}>
      <Animated.View style={[styles.skeletonAvatar, animatedStyle]} />
      <View style={styles.skeletonLines}>
        <Animated.View style={[styles.skeletonLine, styles.skeletonLineWide, animatedStyle]} />
        <Animated.View style={[styles.skeletonLine, animatedStyle]} />
      </View>
    </View>
  );
}

type BagExpandedOrderRowProps = {
  order: PartnerBagOrder;
  bag?: {
    title?: string;
    quantity_available: number;
    quantity_reserved: number;
    max_per_customer?: number | null;
  } | null;
  isLast: boolean;
  historyMode?: boolean;
  markingPickup?: string | null;
  onMarkPickedUp?: (orderId: string) => void;
  onOpenChat?: (orderId: string) => void;
  onQuantityUpdated?: (order: PartnerBagOrder) => void;
  unreadMessages?: number;
};

export function BagExpandedOrderRow({
  order,
  bag,
  isLast,
  historyMode = false,
  markingPickup,
  onMarkPickedUp,
  onOpenChat,
  onQuantityUpdated,
  unreadMessages = 0,
}: BagExpandedOrderRowProps) {
  const [editQtyVisible, setEditQtyVisible] = useState(false);
  const [qtyLoading, setQtyLoading] = useState(false);
  const [qtyToast, setQtyToast] = useState(false);

  const customerName = getDisplayName(order.customer) || order.customer_name || 'Customer';
  const phone = getDisplayPhone(order.customer);
  const normalizedStatus = normalizeOrderStatus(order.status);
  const isPickedUp = normalizedStatus === 'picked_up';
  const isCancelled = normalizedStatus === 'cancelled';
  const isConfirmed = isConfirmedOrderStatus(order.status);
  const isLoading = markingPickup === order.id;
  const quantity = order.quantity ?? 1;
  const serviceType = ((order as { service_type?: 'takeaway' | 'dinein' }).service_type ??
    'takeaway') as 'takeaway' | 'dinein';
  const maxQty = getPartnerEditableOrderMaxQty({
    quantity,
    quantity_available: bag?.quantity_available ?? quantity,
    quantity_reserved: bag?.quantity_reserved ?? quantity,
    max_per_customer: bag?.max_per_customer,
  });

  const statusLabel = isPickedUp
    ? 'Picked up'
    : isCancelled
      ? 'Cancelled'
      : `Reserved ${formatRelativeTime(order.created_at)}`;

  const saveQuantity = async (newQty: number) => {
    setQtyLoading(true);
    const result = await updatePartnerOrderQuantity(order.id, newQty);
    setQtyLoading(false);
    if (result.error) {
      Alert.alert('Could not update', result.error.message);
      return;
    }
    setEditQtyVisible(false);
    setQtyToast(true);
    if (result.order) {
      onQuantityUpdated?.(result.order as unknown as PartnerBagOrder);
    }
  };
  return (
    <View style={[styles.orderRow, isLast && styles.orderRowLast, isCancelled && styles.orderRowCancelled]}>
      <SuccessToast visible={qtyToast} title="Order updated ✅" onHide={() => setQtyToast(false)} />
      <EditOrderQtySheet
        visible={editQtyVisible}
        order={{
          id: order.id,
          quantity,
          customer_name: customerName,
          bag_title: bag?.title ?? 'Rescue bag',
        }}
        maxQty={maxQty}
        submitting={qtyLoading}
        onClose={() => setEditQtyVisible(false)}
        onSave={(qty) => void saveQuantity(qty)}
      />

      <View style={styles.initialsCircle}>
        <Text style={styles.initialsText}>{getInitials(customerName)}</Text>
      </View>

      <View style={styles.orderCenter}>
        <View style={styles.nameRow}>
          <Text style={styles.customerName}>{customerName}</Text>
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
        </View>
        <Text style={styles.quantityReserved}>
          × {quantity} bag{quantity === 1 ? '' : 's'}
          {historyMode ? '' : ' reserved'}
        </Text>
        <Text style={styles.revenueToCollect}>
          {formatNprFromPaisa(order.total_price || 0)}
          {isPickedUp ? ' collected' : isCancelled ? '' : ' to collect'}
        </Text>
        {phone ? (
          <Pressable
            onPress={() => void Linking.openURL(`tel:${phone}`)}
            style={styles.phoneRow}>
            <Phone size={12} color="#6B7280" strokeWidth={2} />
            <Text style={styles.phoneText}>{phone}</Text>
          </Pressable>
        ) : (
          <Text style={styles.phoneHidden}>📵 Phone hidden by customer</Text>
        )}
        {order.customer_note ? (
          <Text style={styles.orderNote}>&quot;{order.customer_note}&quot;</Text>
        ) : null}
        <View style={styles.orderFooter}>
          <Text style={[styles.reservedTime, isCancelled && styles.cancelledTime]}>
            {statusLabel}
          </Text>
          {!historyMode && isConfirmed ? (
            <View style={styles.footerActions}>
              <Pressable
                onPress={() => setEditQtyVisible(true)}
                style={({ pressed }) => [styles.editQtyBtn, pressed && { opacity: 0.85 }]}>
                <Text style={styles.editQtyText}>✏️ Edit qty</Text>
              </Pressable>
              {onMarkPickedUp ? (
                <Pressable
                  onPress={() => onMarkPickedUp(order.id)}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.markPickedUpBtn,
                    (isLoading || pressed) && { opacity: 0.85 },
                  ]}>
                  <Text style={styles.markPickedUpText}>{isLoading ? '…' : '✓ Done'}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : isPickedUp ? (
            <View style={styles.pickedUpPill}>
              <Text style={styles.pickedUpPillText}>✓ Done</Text>
            </View>
          ) : isCancelled ? (
            <View style={styles.cancelledPill}>
              <Text style={styles.cancelledPillText}>Cancelled</Text>
            </View>
          ) : null}
        </View>
        {onOpenChat && !isCancelled ? (
          <Pressable onPress={() => onOpenChat(order.id)} style={styles.chatBtn}>
            <Text style={styles.chatBtnText}>💬 Message customer</Text>
            {unreadMessages > 0 ? (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{unreadMessages}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

type BagOrdersExpandedPanelProps = {
  orders: PartnerBagOrder[] | null;
  loading: boolean;
  bag?: {
    title?: string;
    quantity_available: number;
    quantity_reserved: number;
    max_per_customer?: number | null;
  } | null;
  /** When true, show picked up + cancelled history instead of only active confirmed orders. */
  historyMode?: boolean;
  markingPickup?: string | null;
  onMarkPickedUp?: (orderId: string) => void;
  onOpenChat?: (orderId: string) => void;
  onQuantityUpdated?: (order: PartnerBagOrder) => void;
  unreadByOrder?: Record<string, number>;
};

export function BagOrdersExpandedPanel({
  orders,
  loading,
  bag,
  historyMode = false,
  markingPickup,
  onMarkPickedUp,
  onOpenChat,
  onQuantityUpdated,
  unreadByOrder,
}: BagOrdersExpandedPanelProps) {
  const displayOrders = historyMode
    ? (orders ?? [])
    : (orders?.filter((order) => isConfirmedOrderStatus(order.status)) ?? []);

  return (
    <View style={styles.panel}>
      {loading ? (
        <OrderSkeletonRow />
      ) : displayOrders.length === 0 ? (
        <Text style={styles.emptyText}>
          {historyMode ? 'No orders for this bag' : 'No active orders yet'}
        </Text>
      ) : (
        displayOrders.map((order, index) => (
          <BagExpandedOrderRow
            key={order.id}
            order={order}
            bag={bag}
            isLast={index === displayOrders.length - 1}
            historyMode={historyMode}
            markingPickup={markingPickup}
            onMarkPickedUp={onMarkPickedUp}
            onOpenChat={onOpenChat}
            onQuantityUpdated={onQuantityUpdated}
            unreadMessages={unreadByOrder?.[order.id] ?? 0}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#FAFAF9',
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8E4DE',
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E4DE',
    width: '60%',
  },
  skeletonLineWide: {
    width: '80%',
  },
  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
  },
  orderRowLast: {
    borderBottomWidth: 0,
  },
  orderRowCancelled: {
    opacity: 0.65,
  },
  initialsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F0EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  initialsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  orderCenter: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  serviceBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    color: '#6B7280',
  },
  serviceBadgeTextDinein: {
    color: '#993C1D',
  },
  quantityReserved: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  revenueToCollect: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D85A30',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 13,
    color: '#D85A30',
  },
  phoneHidden: {
    marginTop: 4,
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  orderNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  editQtyBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D85A30',
    backgroundColor: '#FAECE7',
  },
  editQtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D85A30',
  },
  reservedTime: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  cancelledTime: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  markPickedUpBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markPickedUpText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pickedUpPill: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pickedUpPillText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelledPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cancelledPillText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  chatBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 999,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D85A30',
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
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
