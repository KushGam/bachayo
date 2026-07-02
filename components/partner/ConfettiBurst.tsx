import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';

const COLORS = [Palette.primary, '#F0997B', '#25D366', '#FBBF24', Palette.primaryDark];
const PARTICLE_COUNT = 18;

type ConfettiBurstProps = {
  active: boolean;
  onDone?: () => void;
};

function Particle({ index, active }: { index: number; active: boolean }) {
  const progress = useSharedValue(0);
  const { width } = Dimensions.get('window');
  const startX = width / 2 + (index % 5) * 12 - 24;
  const drift = ((index % 7) - 3) * 28;
  const color = COLORS[index % COLORS.length];

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(
      index * 30,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [active, index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: startX + drift * progress.value },
      { translateY: -40 + progress.value * (180 + (index % 4) * 40) },
      { rotate: `${progress.value * 360}deg` },
      { scale: 0.6 + (1 - progress.value) * 0.6 },
    ],
  }));

  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

export function ConfettiBurst({ active, onDone }: ConfettiBurstProps) {
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => onDone?.(), 1000);
    return () => clearTimeout(timer);
  }, [active, onDone]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
        <Particle key={index} index={index} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  particle: {
    position: 'absolute',
    top: '35%',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
