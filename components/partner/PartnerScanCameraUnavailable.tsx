import { CameraOff } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type PartnerScanCameraUnavailableProps = {
  onEnterCode: () => void;
  onBack: () => void;
};

/** Shown in Expo Go (or when camera isn't available) after choosing QR. */
export function PartnerScanCameraUnavailable({
  onEnterCode,
  onBack,
}: PartnerScanCameraUnavailableProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + Spacing.md }]}>
      <Pressable
        onPress={() => {
          void hapticButtonPress();
          onBack();
        }}
        style={styles.backBtn}
        hitSlop={8}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <CameraOff size={28} color={Palette.primary} strokeWidth={2} />
        </View>
        <Text style={styles.title}>QR scan needs a build</Text>
        <Text style={styles.body}>
          Camera scanning isn&apos;t available in Expo Go. Use a development or production build,
          or enter the customer&apos;s 6-digit code instead.
        </Text>

        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onEnterCode();
          }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}>
          <Text style={styles.primaryBtnText}>Enter code instead</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onBack();
          }}
          style={styles.secondaryBtn}
          hitSlop={8}>
          <Text style={styles.secondaryBtnText}>Choose another option</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.lg,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
    paddingVertical: 4,
  },
  backText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg + 4,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: Palette.primary,
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: Spacing.sm,
  },
  secondaryBtnText: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
});
