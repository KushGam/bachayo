import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { hapticButtonPress } from '@/lib/haptics';
import type { PartnerCategory } from '@/types/database';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type DashboardCtaCardProps = {
  category: PartnerCategory;
  onPress: () => void;
};

export function DashboardCtaCard({ onPress }: DashboardCtaCardProps) {
  const scale = useSharedValue(1);

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
      <View style={styles.textureCircle} pointerEvents="none" />

      <View style={styles.copy}>
        <Text style={styles.title}>List today&apos;s rescue bag</Text>
        <Text style={styles.subtitle}>Turn tonight&apos;s surplus into revenue</Text>
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
    backgroundColor: '#D85A30',
    paddingHorizontal: 20,
    paddingVertical: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#D85A30',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  textureCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: -40,
    top: -60,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    lineHeight: 18,
  },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
    marginTop: -2,
  },
});
