import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Type } from '@/constants/theme';
import { normalizeOrderStatus } from '@/lib/orderStatus';
import type { OrderStatus } from '@/types/database';

type OrderStatusBadgeProps = {
  status: string;
};

function labelFor(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Ready';
    case 'picked_up':
      return 'Picked up';
    case 'cancelled':
      return 'Cancelled';
    case 'missed':
      return 'Missed';
    default:
      return status;
  }
}

function colorsFor(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return { bg: Palette.warningBg, text: Palette.warning, border: '#E8D9A8' };
    case 'confirmed':
      return { bg: Palette.primaryLight, text: Palette.primaryDark, border: Palette.overlay.border };
    case 'picked_up':
      return { bg: Palette.successBg, text: Palette.success, border: '#C5D9CB' };
    case 'cancelled':
      return { bg: Palette.surfaceMuted, text: Palette.textSecondary, border: Palette.borderSubtle };
    case 'missed':
      return { bg: '#FEF3C7', text: '#B45309', border: '#F5D98A' };
    default:
      return { bg: Palette.surfaceMuted, text: Palette.textSecondary, border: Palette.borderSubtle };
  }
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const normalized = normalizeOrderStatus(status);
  const colors = colorsFor(normalized);

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{labelFor(normalized)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  text: {
    ...Type.label,
    fontWeight: '700',
    fontSize: 11,
  },
});
