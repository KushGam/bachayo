import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { CATEGORY_BAG_CONFIG } from '@/constants/partnerBagPresets';
import { hapticButtonPress } from '@/lib/haptics';
import type { PartnerCategory } from '@/types/database';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type DashboardCtaCardProps = {
  category: PartnerCategory;
  onPress: () => void;
};

export function DashboardCtaCard({ category, onPress }: DashboardCtaCardProps) {
  const scale = useSharedValue(1);
  const config = CATEGORY_BAG_CONFIG[category] ?? CATEGORY_BAG_CONFIG.restaurant;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      onPress={() => {
        void hapticButtonPress();
        onPress();
      }}
      android_ripple={null}
      style={[styles.card, animStyle]}>
      <View style={styles.copy}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🛍</Text>
        </View>
        <Text style={styles.title}>List today&apos;s rescue bag</Text>
        <Text style={styles.subtitle}>{config.ctaTagline}</Text>
      </View>
      <View style={styles.plusCircle}>
        <Text style={styles.plus}>+</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: Palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  copy: {
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconEmoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.white,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
    lineHeight: 18,
  },
  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.primary,
    lineHeight: 28,
    marginTop: -2,
  },
});
