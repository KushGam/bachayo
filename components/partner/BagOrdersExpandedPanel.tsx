import { Phone } from 'lucide-react-native';
import { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { formatRelativeTime, getInitials } from '@/lib/helpers';
import { isConfirmedOrderStatus, isReservedOrderStatus, normalizeOrderStatus } from '@/lib/orderStatus';
import { formatNprFromPaisa, type PartnerBagOrder } from '@/lib/partnerBags';

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
  _waitingCustomers: number,
): { text: string; color: string } {
  if (reserved === 0) {
    return {
      text: `${reserved} of ${total} bags reserved`,
      color: '#6B7280',
    };
  }

  const soldOut = total > 0 && reserved >= total;
  const text = `${reserved} of ${total} bags reserved`;

  if (soldOut) {
    return { text, color: '#10B981' };
  }
  if (total > 0 && reserved / total > 0.5) {
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
  isLast: boolean;
  markingPickup?: string | null;
  onMarkPickedUp?: (orderId: string) => void;
};

export function BagExpandedOrderRow({
  order,
  isLast,
  markingPickup,
  onMarkPickedUp,
}: BagExpandedOrderRowProps) {
  const customerName = order.customer?.full_name || 'Customer';
  const phone = order.customer?.phone;
  const normalizedStatus = normalizeOrderStatus(order.status);
  const isPickedUp = normalizedStatus === 'picked_up';
  const isConfirmed = isConfirmedOrderStatus(order.status);
  const isLoading = markingPickup === order.id;
  const quantity = order.quantity ?? 1;

  return (
    <View style={[styles.orderRow, isLast && styles.orderRowLast]}>
      <View style={styles.initialsCircle}>
        <Text style={styles.initialsText}>{getInitials(customerName)}</Text>
      </View>

      <View style={styles.orderCenter}>
        <Text style={styles.customerName}>{customerName}</Text>
        <Text style={styles.quantityReserved}>
          × {quantity} bag{quantity === 1 ? '' : 's'} reserved
        </Text>
        <Text style={styles.revenueToCollect}>
          {formatNprFromPaisa(order.total_price || 0)} to collect
        </Text>
        {phone ? (
          <Pressable
            onPress={() => void Linking.openURL(`tel:${phone}`)}
            style={styles.phoneRow}>
            <Phone size={12} color="#6B7280" strokeWidth={2} />
            <Text style={styles.phoneText}>{phone}</Text>
          </Pressable>
        ) : null}
        {order.customer_note ? (
          <Text style={styles.orderNote}>&quot;{order.customer_note}&quot;</Text>
        ) : null}
        <View style={styles.orderFooter}>
          <Text style={styles.reservedTime}>
            {isPickedUp ? 'Picked up' : `Reserved ${formatRelativeTime(order.created_at)}`}
          </Text>
          {isConfirmed && onMarkPickedUp ? (
            <Pressable
              onPress={() => onMarkPickedUp(order.id)}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.markPickedUpBtn,
                (isLoading || pressed) && { opacity: 0.85 },
              ]}>
              <Text style={styles.markPickedUpText}>{isLoading ? '…' : '✓ Done'}</Text>
            </Pressable>
          ) : isPickedUp ? (
            <View style={styles.pickedUpPill}>
              <Text style={styles.pickedUpPillText}>✓</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

type BagOrdersExpandedPanelProps = {
  orders: PartnerBagOrder[] | null;
  loading: boolean;
  markingPickup?: string | null;
  onMarkPickedUp?: (orderId: string) => void;
};

export function BagOrdersExpandedPanel({
  orders,
  loading,
  markingPickup,
  onMarkPickedUp,
}: BagOrdersExpandedPanelProps) {
  const displayOrders =
    orders?.filter((order) => isConfirmedOrderStatus(order.status)) ?? [];

  return (
    <View style={styles.panel}>
      {loading ? (
        <OrderSkeletonRow />
      ) : displayOrders.length === 0 ? (
        <Text style={styles.emptyText}>No active orders yet</Text>
      ) : (
        displayOrders.map((order, index) => (
          <BagExpandedOrderRow
            key={order.id}
            order={order}
            isLast={index === displayOrders.length - 1}
            markingPickup={markingPickup}
            onMarkPickedUp={onMarkPickedUp}
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
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
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
  reservedTime: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
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
});
