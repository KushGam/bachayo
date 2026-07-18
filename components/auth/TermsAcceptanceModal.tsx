import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TermsCheckbox } from '@/components/auth/TermsCheckbox';
import { Palette } from '@/constants/Colors';

type TermsAcceptanceModalProps = {
  visible: boolean;
  onAccept: () => Promise<void>;
  onCancel: () => void;
};

const BENEFITS = [
  'Your personal data is never sold',
  'Free to reserve — pay at pickup only',
  'Cancel reservations anytime',
] as const;

export function TermsAcceptanceModal({
  visible,
  onAccept,
  onCancel,
}: TermsAcceptanceModalProps) {
  const insets = useSafeAreaInsets();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setAccepted(false);
      setLoading(false);
    }
  }, [visible]);

  const handleAccept = async () => {
    if (!accepted) {
      Alert.alert(
        'Please accept terms',
        'You must agree to our Terms of Service and Privacy Policy to continue.',
      );
      return;
    }
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <Text style={styles.title}>Almost there!</Text>
        <Text style={styles.subtitle}>
          Please review and accept our terms before creating your account
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((item) => (
            <View key={item} style={styles.benefitRow}>
              <View style={styles.benefitCheck}>
                <Text style={styles.benefitCheckText}>✓</Text>
              </View>
              <Text style={styles.benefitText}>{item}</Text>
            </View>
          ))}
        </View>

        <TermsCheckbox accepted={accepted} onToggle={() => setAccepted((v) => !v)} />

        <Pressable
          onPress={() => void handleAccept()}
          disabled={loading}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: accepted
                ? pressed
                  ? Palette.primaryDark
                  : Palette.primary
                : '#F0EDE8',
            },
          ]}>
          <Text style={[styles.primaryBtnText, !accepted && styles.primaryBtnTextDisabled]}>
            {loading ? 'Creating account...' : 'Create my account →'}
          </Text>
        </Pressable>

        <Pressable onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  benefits: {
    backgroundColor: Palette.background,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  benefitCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCheckText: {
    fontSize: 12,
    color: Palette.success,
    fontWeight: '700',
  },
  benefitText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  primaryBtn: {
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBtnTextDisabled: {
    color: '#9CA3AF',
  },
  cancelBtn: {
    marginTop: 14,
    padding: 8,
  },
  cancelText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});
