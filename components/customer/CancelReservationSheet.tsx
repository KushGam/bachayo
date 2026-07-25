import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryById } from '@/constants/partnerCategories';
import {
  CANCELLATION_REASONS,
  type CancellationEligibility,
} from '@/constants/cancellation';
import { formatNprPaisa, formatTime12h } from '@/lib/helpers';
import { hapticButtonPress } from '@/lib/haptics';
import type { CustomerOrderWithDetails } from '@/types/app';

type CancelReservationSheetProps = {
  visible: boolean;
  order: CustomerOrderWithDetails | null;
  eligibility: CancellationEligibility;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: string | null; cancelQuantity: number }) => void;
};

export function CancelReservationSheet({
  visible,
  order,
  eligibility,
  loading = false,
  onClose,
  onConfirm,
}: CancelReservationSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [cancelQuantity, setCancelQuantity] = useState(1);

  useEffect(() => {
    if (visible && order) {
      setSelectedReason(null);
      setCancelQuantity(order.quantity > 1 ? 1 : order.quantity);
    }
  }, [visible, order]);

  const handleClose = () => {
    setSelectedReason(null);
    onClose();
  };

  const handleConfirm = () => {
    void hapticButtonPress();
    onConfirm({ reason: selectedReason, cancelQuantity });
  };

  if (!order) return null;

  const category = getCategoryById(order.partner.category);
  const pickupLabel = `🕐 ${formatTime12h(order.bag.pickup_start)}–${formatTime12h(order.bag.pickup_end)} today`;
  const canPartial = order.quantity > 1;
  const remaining = order.quantity - cancelQuantity;
  const unitPrice = Math.round(order.total_price / order.quantity);
  const confirmLabel =
    canPartial && remaining > 0
      ? `Cancel ${cancelQuantity} · keep ${remaining}`
      : canPartial
        ? `Cancel all ${order.quantity} bags`
        : 'Yes, cancel reservation';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {canPartial ? 'Cancel bags?' : 'Cancel reservation?'}
            </Text>
            <Text style={styles.subtitle}>
              {canPartial
                ? 'Cancel some bags and keep the rest, or free the whole reservation.'
                : 'Are you sure you want to free up this slot?'}
            </Text>
          </View>

          <View style={styles.summary}>
            {order.partner.cover_image_url ? (
              <Image source={{ uri: order.partner.cover_image_url }} style={styles.partnerImage} />
            ) : (
              <View style={styles.partnerPlaceholder}>
                <Text style={styles.partnerEmoji}>{category?.icon ?? '🍽'}</Text>
              </View>
            )}
            <View style={styles.summaryBody}>
              <Text style={styles.partnerName}>{order.partner.name}</Text>
              <Text style={styles.bagTitle} numberOfLines={1}>
                {order.bag.title}
              </Text>
              <Text style={styles.pickupLine}>{pickupLabel}</Text>
              <Text style={styles.qtyLine}>
                Reserved {order.quantity} · {formatNprPaisa(order.total_price)}
              </Text>
            </View>
          </View>

          {canPartial ? (
            <View style={styles.qtySection}>
              <Text style={styles.reasonLabel}>How many to cancel?</Text>
              <View style={styles.qtyRow}>
                <Pressable
                  onPress={() => {
                    void hapticButtonPress();
                    setCancelQuantity((q) => Math.max(1, q - 1));
                  }}
                  disabled={cancelQuantity <= 1 || loading}
                  style={[styles.qtyBtn, (cancelQuantity <= 1 || loading) && styles.qtyBtnDisabled]}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <View style={styles.qtyValueWrap}>
                  <Text style={styles.qtyValue}>{cancelQuantity}</Text>
                  <Text style={styles.qtyHint}>
                    {remaining > 0
                      ? `Keep ${remaining} · ${formatNprPaisa(unitPrice * remaining)}`
                      : 'Cancel entire reservation'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    void hapticButtonPress();
                    setCancelQuantity((q) => Math.min(order.quantity, q + 1));
                  }}
                  disabled={cancelQuantity >= order.quantity || loading}
                  style={[
                    styles.qtyBtn,
                    (cancelQuantity >= order.quantity || loading) && styles.qtyBtnDisabled,
                  ]}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.reasonSection}>
            <Text style={styles.reasonLabel}>Reason (optional)</Text>
            <View style={styles.reasonPills}>
              {CANCELLATION_REASONS.map((reason) => {
                const active = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    onPress={() => {
                      void hapticButtonPress();
                      setSelectedReason(active ? null : reason);
                    }}
                    style={[styles.reasonPill, active && styles.reasonPillActive]}>
                    <Text style={[styles.reasonPillText, active && styles.reasonPillTextActive]}>
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            style={[
              styles.policyNote,
              eligibility === 'late' && styles.policyNoteLate,
            ]}>
            {eligibility === 'late' ? (
              <Text style={styles.policyTextLate}>
                ⚠️ Late cancellation — the restaurant may have already prepared your bag. Please only
                cancel if necessary.
              </Text>
            ) : (
              <Text style={styles.policyText}>
                ℹ️ Free cancellation — freed slots become available for other customers immediately.
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed && !loading && { opacity: 0.92 },
                loading && { opacity: 0.7 },
              ]}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.confirmText}>Cancelling...</Text>
                </View>
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleClose}
              disabled={loading}
              style={({ pressed }) => [styles.keepBtn, pressed && { opacity: 0.92 }]}>
              <Text style={styles.keepText}>Keep my reservation</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  summary: {
    backgroundColor: '#F5F3EF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  partnerPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerEmoji: {
    fontSize: 20,
  },
  summaryBody: {
    flex: 1,
    gap: 2,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bagTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  pickupLine: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  qtyLine: {
    fontSize: 12,
    fontWeight: '600',
    color: '#993C1D',
    marginTop: 2,
  },
  qtySection: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#993C1D',
    lineHeight: 26,
  },
  qtyValueWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  qtyValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  qtyHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  reasonSection: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  reasonPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reasonPill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  reasonPillActive: {
    borderColor: '#D85A30',
    backgroundColor: '#FAECE7',
  },
  reasonPillText: {
    fontSize: 13,
    color: '#374151',
  },
  reasonPillTextActive: {
    color: '#993C1D',
    fontWeight: '600',
  },
  policyNote: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 12,
  },
  policyNoteLate: {
    backgroundColor: '#FEF3C7',
  },
  policyText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  policyTextLate: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  actions: {
    marginTop: 20,
    marginHorizontal: 20,
    gap: 10,
    paddingBottom: 8,
  },
  confirmBtn: {
    backgroundColor: '#E24B4A',
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  keepBtn: {
    backgroundColor: '#F5F3EF',
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
