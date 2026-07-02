import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';

type StepProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(currentStep / totalSteps, { duration: 220 });
  }, [currentStep, totalSteps, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, progress.value)) * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Step {currentStep} of {totalSteps}
      </Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <View style={styles.segments}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, i < currentStep ? styles.segmentActive : styles.segmentInactive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    color: Palette.textMuted,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.lightGreenBg,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Palette.primary,
    borderRadius: 2,
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  segmentActive: {
    backgroundColor: Palette.primary,
  },
  segmentInactive: {
    backgroundColor: Palette.lightGreenBg,
  },
});
