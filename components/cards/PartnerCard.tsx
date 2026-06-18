import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { formatNprPaisa } from '@/lib/helpers';
import type { PartnerOrderWithCustomer } from '@/types/app';

type PartnerCardProps = {
  order: PartnerOrderWithCustomer;
};

export const PartnerCard = memo(function PartnerCard({ order }: PartnerCardProps) {
  const isPickedUp = order.status === 'picked_up';

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <Text style={styles.customerName}>
          {order.customer.full_name || order.customer.phone || 'Customer'}
        </Text>
        <View style={[styles.qrStatus, isPickedUp ? styles.qrStatusDone : styles.qrStatusPending]}>
          <Text
            style={[
              styles.qrStatusText,
              isPickedUp ? styles.qrStatusTextDone : styles.qrStatusTextPending,
            ]}>
            {isPickedUp ? 'Scanned' : 'Awaiting scan'}
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  customerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  qrStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  qrStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  qrStatusDone: {
    backgroundColor: Palette.lightGreenBg,
  },
  qrStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  qrStatusTextPending: {
    color: Palette.amber,
  },
  qrStatusTextDone: {
    color: Palette.primary,
  },
  orderMeta: {
    fontSize: 13,
    color: Palette.textMuted,
    fontWeight: '600',
  },
});
