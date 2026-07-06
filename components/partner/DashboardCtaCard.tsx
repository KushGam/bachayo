import { Plus } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';
import type { PartnerCategory } from '@/types/database';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type DashboardCtaCardProps = {
  category: PartnerCategory;
  onPress: () => void;
  compact?: boolean;
};

export function DashboardCtaCard({ onPress, compact = false }: DashboardCtaCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      onPress={() => {
        void hapticButtonPress();
        onPress();
      }}
      android_ripple={null}
      style={[styles.card, compact && styles.cardCompact, animStyle]}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.glowSecondary} pointerEvents="none" />

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Today&apos;s listing</Text>
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {compact ? 'Add another rescue bag' : 'List a rescue bag'}
        </Text>
        {!compact ? (
          <Text style={styles.subtitle}>Turn tonight&apos;s surplus into revenue</Text>
        ) : null}
      </View>

      <View style={styles.plusCircle}>
        <Plus size={22} color={Palette.white} strokeWidth={2.5} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: Palette.primary,
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  cardCompact: {
    paddingVertical: Spacing.md + 2,
    marginTop: Spacing.md,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -50,
    top: -70,
  },
  glowSecondary: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    left: -20,
    bottom: -40,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...Type.h2,
    color: Palette.white,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  subtitle: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
