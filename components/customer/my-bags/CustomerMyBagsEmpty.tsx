import { useRouter } from 'expo-router';
import { Clock, Package, QrCode, ShoppingBag, Store } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

import type { CustomerMyBagsTab } from './CustomerMyBagsHeader';

type CustomerMyBagsEmptyProps = {
  tab: CustomerMyBagsTab;
};

const ACTIVE_STEPS = [
  { icon: Store, label: 'Browse bags nearby' },
  { icon: QrCode, label: 'Reserve & get your QR' },
  { icon: ShoppingBag, label: 'Pick up & pay at the counter' },
] as const;

export function CustomerMyBagsEmpty({ tab }: CustomerMyBagsEmptyProps) {
  const router = useRouter();
  const isActive = tab === 'active';

  if (!isActive) {
    return (
      <View style={styles.wrap}>
        <View style={styles.pastCard}>
          <View style={styles.pastIconWrap}>
            <Package size={28} color={Palette.textSecondary} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>No past orders yet</Text>
          <Text style={styles.subtitle}>
            Picked up, missed, and cancelled reservations will appear here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.activeCard}>
        <View style={styles.heroIconOuter}>
          <View style={styles.heroIconInner}>
            <ShoppingBag size={28} color={Palette.primary} strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.title}>Ready when you reserve</Text>
        <Text style={styles.subtitle}>
          Active pickups live here — QR code, countdown, and directions in one place.
        </Text>

        <View style={styles.steps}>
          {ACTIVE_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <View key={step.label} style={styles.stepRow}>
                <View style={styles.stepIndex}>
                  <Text style={styles.stepIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.stepIcon}>
                  <Icon size={15} color={Palette.primaryDark} strokeWidth={2.2} />
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            void hapticButtonPress();
            router.push('/(tabs)/customer/home');
          }}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
          <Text style={styles.ctaText}>Browse rescue bags</Text>
        </Pressable>

        <View style={styles.hintRow}>
          <Clock size={13} color={Palette.textTertiary} strokeWidth={2} />
          <Text style={styles.hint}>Fresh listings usually drop around 6–8pm</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 120,
  },
  activeCard: {
    ...CardChrome,
    backgroundColor: Palette.surface,
    borderRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    ...FloatingShadow,
  },
  pastCard: {
    ...CardChrome,
    backgroundColor: Palette.surface,
    borderRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    ...FloatingShadow,
  },
  heroIconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  heroIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: Spacing.sm,
    maxWidth: 280,
  },
  steps: {
    alignSelf: 'stretch',
    marginTop: Spacing.xl,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.background,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  stepIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '800',
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    flex: 1,
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  cta: {
    marginTop: Spacing.xl,
    alignSelf: 'stretch',
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '700',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  hint: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.92,
  },
});
