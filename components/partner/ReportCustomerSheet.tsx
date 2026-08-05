import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SuccessToast } from '@/components/ui/SuccessToast';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress, hapticSuccess } from '@/lib/haptics';
import { CUSTOMER_REPORT_REASONS, submitReport } from '@/lib/reports';

type ReportCustomerSheetProps = {
  visible: boolean;
  customerId: string;
  customerName: string;
  orderId: string;
  onClose: () => void;
};

export function ReportCustomerSheet({
  visible,
  customerId,
  customerName,
  orderId,
  onClose,
}: ReportCustomerSheetProps) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setDetails('');
      setError(null);
      setSubmitting(false);
    }
  }, [visible]);

  const onSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReport({
        reportedType: 'customer',
        reportedId: customerId,
        reason,
        details,
        orderId,
      });
      void hapticSuccess();
      setToast(true);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SuccessToast
        visible={toast}
        title="Report submitted"
        message="Thank you for helping keep LastBag safe."
        onHide={() => setToast(false)}
      />

      {visible ? (
        <Modal
          visible={visible}
          transparent
          animationType="slide"
          onRequestClose={onClose}>
          <Pressable
            style={styles.backdrop}
            onPress={submitting ? undefined : onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.handle} />
            <Text style={styles.title}>Report {customerName}</Text>
            <Text style={styles.subtitle}>Help us keep LastBag safe</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.reasons}>
              {CUSTOMER_REPORT_REASONS.map((item) => {
                const selected = reason === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      void hapticButtonPress();
                      setReason(item);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={[styles.pill, selected && styles.pillSelected]}>
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}

              <Text style={styles.detailsLabel}>Add more details (optional)</Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Tell us what happened..."
                placeholderTextColor={Palette.textTertiary}
                multiline
                maxLength={500}
                style={styles.detailsInput}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                disabled={!reason || submitting}
                onPress={() => void onSubmit()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [
                  styles.submit,
                  (!reason || submitting) && styles.submitDisabled,
                  pressed && reason && !submitting && { opacity: 0.92 },
                ]}>
                {submitting ? (
                  <ActivityIndicator color={Palette.white} />
                ) : (
                  <Text style={styles.submitText}>Submit report →</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    marginBottom: Spacing.md,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  reasons: {
    gap: 8,
    paddingBottom: Spacing.md,
  },
  pill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Palette.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillSelected: {
    backgroundColor: '#D85A30',
    borderColor: '#D85A30',
  },
  pillText: {
    ...Type.bodyMedium,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: Palette.white,
  },
  detailsLabel: {
    ...Type.label,
    color: Palette.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  detailsInput: {
    minHeight: 80,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    color: Palette.textPrimary,
    ...Type.body,
  },
  error: {
    ...Type.caption,
    color: Palette.danger,
  },
  submit: {
    marginTop: Spacing.sm,
    backgroundColor: '#D85A30',
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '700',
  },
});
