import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { formatNprPaisa } from '@/lib/helpers';
import type { PartnerOrderWithCustomer } from '@/types/app';
import type { OrderStatus } from '@/types/database';

type PartnerCardProps = {
  order: PartnerOrderWithCustomer;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked up',
  cancelled: 'Cancelled',
  missed: 'Missed',
};

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: Palette.amber },
  confirmed: { bg: Palette.lightGreenBg, text: Palette.primaryDark },
  picked_up: { bg: '#D1FAE5', text: '#047857' },
  cancelled: { bg: '#FEE2E2', text: '#B91C1C' },
  missed: { bg: '#E5E7EB', text: '#4B5563' },
};

export const PartnerCard = memo(function PartnerCard({ order }: PartnerCardProps) {
  const statusStyle = STATUS_STYLES[order.status];

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <Text style={styles.customerName}>
          {order.customer.full_name || order.customer.phone || 'Customer'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.orderMeta}>
        {order.bag.title} • Qty {order.quantity} • {formatNprPaisa(order.total_price)}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  customerName: {
    flex: 1,
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  statusText: {
    ...Type.label,
    fontWeight: '700',
  },
  orderMeta: {
    ...Type.caption,
    color: Palette.textMuted,
    fontWeight: '600',
  },
});
