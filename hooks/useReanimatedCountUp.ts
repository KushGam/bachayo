import { useEffect, useState } from 'react';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type UseReanimatedCountUpOptions = {
  durationMs?: number;
  enabled?: boolean;
};

export function useReanimatedCountUp(
  target: number,
  { durationMs = 800, enabled = true }: UseReanimatedCountUpOptions = {},
) {
  const [value, setValue] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, {
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [target, durationMs, enabled, progress]);

  useAnimatedReaction(
    () => (enabled ? Math.round(progress.value * target) : target),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setValue)(current);
      }
    },
    [target, enabled],
  );

  return value;
}
