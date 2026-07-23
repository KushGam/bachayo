import { usePathname, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TermsCheckbox } from '@/components/auth/TermsCheckbox';
import { Palette } from '@/constants/Colors';

type TermsAcceptanceModalProps = {
  visible: boolean;
  onAccept: () => Promise<void>;
  onCancel: () => void;
  /** When false, only the Cancel button dismisses. Default true. */
  dismissOnBackdrop?: boolean;
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
  dismissOnBackdrop = true,
}: TermsAcceptanceModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // RN Modal stays above the stack — hide it while reading legal pages.
  const onLegalPage = Boolean(pathname?.includes('/legal/'));
  const modalVisible = visible && !onLegalPage;

  useEffect(() => {
    if (!visible) {
      setAccepted(false);
      setLoading(false);
    }
  }, [visible]);

  const handleAccept = async () => {
    if (loading) return;
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
    } catch (err) {
      Alert.alert(
        'Could not save',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const openLegal = (href: Href) => {
    router.push(href);
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => {
        if (!loading) onCancel();
      }}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          disabled={!dismissOnBackdrop || loading}
          onPress={() => {
            if (dismissOnBackdrop && !loading) onCancel();
          }}
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24, maxHeight: '92%' }]}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
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

            <TermsCheckbox
              accepted={accepted}
              onToggle={() => setAccepted((v) => !v)}
              onOpenLegal={openLegal}
            />

            <Pressable
              onPress={() => void handleAccept()}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: accepted
                    ? pressed || loading
                      ? Palette.primaryDark
                      : Palette.primary
                    : '#F0EDE8',
                },
              ]}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={Palette.white} />
                  <Text style={styles.primaryBtnText}>Saving…</Text>
                </View>
              ) : (
                <Text style={[styles.primaryBtnText, !accepted && styles.primaryBtnTextDisabled]}>
                  Create my account →
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                if (!loading) onCancel();
              }}
              disabled={loading}
              style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 2,
    elevation: 8,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    marginTop: 14,
    padding: 8,
    marginBottom: 8,
  },
  cancelText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});
