import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Hash, QrCode } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

export type ScanMode = 'choose' | 'qr' | 'manual';

type PartnerScanChooserProps = {
  onSelect: (mode: 'qr' | 'manual') => void;
};

export function PartnerScanChooser({ onSelect }: PartnerScanChooserProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.glowPrimary} pointerEvents="none" />
        <View style={styles.glowSecondary} pointerEvents="none" />

        <Text style={styles.heroEyebrow}>Partner tools</Text>
        <Text style={styles.heroTitle}>Confirm pickup</Text>
        <Text style={styles.heroSubtitle}>
          Verify the guest with a quick QR scan or their 6-digit code.
        </Text>
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Text style={styles.sectionLabel}>Choose a method</Text>

        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onSelect('qr');
          }}
          style={({ pressed }) => [styles.option, styles.optionFeatured, pressed && styles.pressed]}>
          <LinearGradient
            colors={[Palette.primary, Palette.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.optionFeaturedInner}>
            <View style={styles.optionTop}>
              <View style={styles.featuredIcon}>
                <QrCode size={30} color={Palette.white} strokeWidth={2} />
              </View>
              <View style={styles.recommendedPill}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            </View>
            <View style={styles.optionBottom}>
              <View style={styles.optionCopy}>
                <Text style={styles.featuredTitle}>Scan QR code</Text>
                <Text style={styles.featuredBody}>
                  Open the camera and point it at the customer&apos;s pickup QR
                </Text>
              </View>
              <View style={styles.chevronFeatured}>
                <ChevronRight size={20} color={Palette.white} strokeWidth={2.5} />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onSelect('manual');
          }}
          style={({ pressed }) => [styles.option, styles.optionSecondary, pressed && styles.pressed]}>
          <View style={styles.secondaryIcon}>
            <Hash size={24} color={Palette.primary} strokeWidth={2.25} />
          </View>
          <View style={styles.optionCopy}>
            <Text style={styles.secondaryTitle}>Enter 6-digit code</Text>
            <Text style={styles.secondaryBody}>
              Type the code from the customer&apos;s My Bags screen
            </Text>
          </View>
          <View style={styles.chevronSecondary}>
            <ChevronRight size={18} color={Palette.textTertiary} strokeWidth={2.25} />
          </View>
        </Pressable>

        <Text style={styles.footerHint}>
          Tip: the code works even if the customer&apos;s phone is offline.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 4,
    borderBottomLeftRadius: Radius.lg + 8,
    borderBottomRightRadius: Radius.lg + 8,
    overflow: 'hidden',
  },
  glowPrimary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -70,
    right: -50,
  },
  glowSecondary: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: -20,
  },
  heroEyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.6,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Type.body,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 22,
    maxWidth: 300,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  sectionLabel: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 2,
    marginLeft: 2,
  },
  option: {
    borderRadius: Radius.lg + 6,
    overflow: 'hidden',
  },
  optionFeatured: {
    shadowColor: Palette.primaryDarker,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  optionFeaturedInner: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    minHeight: 168,
    justifyContent: 'space-between',
  },
  optionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedPill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  recommendedText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  optionBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  featuredTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.3,
  },
  featuredBody: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
  chevronFeatured: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  optionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    minHeight: 96,
  },
  secondaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
    fontWeight: '700',
  },
  secondaryBody: {
    ...Type.caption,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  chevronSecondary: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  footerHint: {
    ...Type.caption,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
});
