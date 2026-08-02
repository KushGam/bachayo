import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

export type EditOrderQtyTarget = {
  id: string;
  quantity: number;
  customer_name: string;
  bag_title: string;
};

type EditOrderQtySheetProps = {
  visible: boolean;
  order: EditOrderQtyTarget | null;
  /** Upper bound (stock + max per customer). Defaults to current qty if omitted. */
  maxQty?: number;
  submitting?: boolean;
  onClose: () => void;
  onSave: (newQty: number) => void;
};

export function EditOrderQtySheet({
  visible,
  order,
  maxQty,
  submitting = false,
  onClose,
  onSave,
}: EditOrderQtySheetProps) {
  const insets = useSafeAreaInsets();
  const [newQty, setNewQty] = useState(1);

  useEffect(() => {
    if (visible && order) {
      setNewQty(order.quantity);
    }
  }, [visible, order?.id, order?.quantity]);

  if (!order) return null;

  const ceiling = Math.max(1, maxQty ?? order.quantity);
  const canDecrease = newQty > 1 && !submitting;
  const canIncrease = newQty < ceiling && !submitting;
  const changed = newQty !== order.quantity;
  const canSave = changed && !submitting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={submitting ? undefined : onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />

        <Text style={styles.title}>Edit order quantity</Text>
        <Text style={styles.customer}>Order by: {order.customer_name}</Text>
        <Text style={styles.bagTitle}>{order.bag_title}</Text>

        <View style={styles.divider} />

        <Text style={styles.current}>Current quantity: {order.quantity}</Text>

        <View style={styles.stepperRow}>
          <Pressable
            disabled={!canDecrease}
            onPress={() => {
              void hapticButtonPress();
              setNewQty((prev) => Math.max(1, prev - 1));
            }}
            style={({ pressed }) => [
              styles.minusBtn,
              !canDecrease && styles.stepperDisabled,
              pressed && canDecrease && styles.pressed,
            ]}>
            <Text style={styles.minusText}>−</Text>
          </Pressable>

          <Text style={styles.qtyValue}>{newQty}</Text>

          <Pressable
            disabled={!canIncrease}
            onPress={() => {
              void hapticButtonPress();
              setNewQty((prev) => Math.min(ceiling, prev + 1));
            }}
            style={({ pressed }) => [
              styles.plusBtn,
              !canIncrease && styles.plusDisabled,
              pressed && canIncrease && styles.pressed,
            ]}>
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>

        {newQty > order.quantity ? (
          <View style={[styles.note, styles.noteIncrease]}>
            <Text style={styles.noteIncreaseText}>
              ✓ Increasing from {order.quantity} to {newQty}
            </Text>
          </View>
        ) : null}

        {newQty < order.quantity ? (
          <View style={[styles.note, styles.noteDecrease]}>
            <Text style={styles.noteDecreaseText}>
              ⚠ Reducing from {order.quantity} to {newQty}
            </Text>
          </View>
        ) : null}

        {ceiling <= order.quantity && newQty >= ceiling ? (
          <Text style={styles.limitHint}>Max available for this order: {ceiling}</Text>
        ) : null}

        <Pressable
          disabled={!canSave}
          onPress={() => onSave(newQty)}
          style={({ pressed }) => [
            styles.saveBtn,
            !canSave && styles.saveDisabled,
            pressed && canSave && styles.pressed,
          ]}>
          {submitting ? (
            <ActivityIndicator color={Palette.white} />
          ) : (
            <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save changes</Text>
          )}
        </Pressable>

        <Pressable onPress={onClose} disabled={submitting} hitSlop={8} style={styles.cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 25, 23, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  customer: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginBottom: 4,
  },
  bagTitle: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.border,
    marginVertical: 16,
  },
  current: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  minusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  minusText: {
    fontSize: 22,
    color: Palette.textPrimary,
    fontWeight: '300',
  },
  qtyValue: {
    fontSize: 36,
    fontWeight: '900',
    color: Palette.textPrimary,
    minWidth: 60,
    textAlign: 'center',
  },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusDisabled: {
    backgroundColor: Palette.primaryMid,
    opacity: 0.45,
  },
  plusText: {
    fontSize: 22,
    color: Palette.white,
    fontWeight: '300',
  },
  stepperDisabled: {
    opacity: 0.4,
  },
  note: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  noteIncrease: {
    backgroundColor: '#ECFDF5',
  },
  noteIncreaseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  noteDecrease: {
    backgroundColor: '#FEF3C7',
  },
  noteDecreaseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  limitHint: {
    ...Type.caption,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginBottom: 12,
  },
  saveBtn: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: {
    backgroundColor: Palette.background,
  },
  saveText: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.white,
  },
  saveTextDisabled: {
    color: Palette.textTertiary,
  },
  cancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelText: {
    ...Type.caption,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.9,
  },
});
