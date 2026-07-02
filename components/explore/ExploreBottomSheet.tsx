import { type ReactNode, useEffect, useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { exploreStyles as styles } from './exploreStyles';

const SPRING = { damping: 24, stiffness: 240 };
const COLLAPSED_VISIBLE = 168;

type ExploreBottomSheetProps = {
  children: ReactNode;
  titleRow: ReactNode;
  selectedCard?: ReactNode;
  expandForSelection?: boolean;
};

function nearestSnapPoint(value: number, points: number[]) {
  'worklet';
  let closest = points[0];
  let minDistance = Math.abs(value - points[0]);
  for (let index = 1; index < points.length; index += 1) {
    const distance = Math.abs(value - points[index]);
    if (distance < minDistance) {
      minDistance = distance;
      closest = points[index];
    }
  }
  return closest;
}

export function ExploreBottomSheet({
  children,
  titleRow,
  selectedCard,
  expandForSelection = false,
}: ExploreBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const metrics = useMemo(() => {
    const expandedHeight = screenHeight * 0.78;
    const halfHeight = screenHeight * 0.48;
    const collapsedOffset = expandedHeight - COLLAPSED_VISIBLE;
    const halfOffset = expandedHeight - halfHeight;
    const snapPoints = [0, halfOffset, collapsedOffset] as const;

    return {
      expandedHeight,
      halfOffset,
      collapsedOffset,
      snapPoints,
    };
  }, [screenHeight]);

  const translateY = useSharedValue(metrics.halfOffset);
  const panStartY = useSharedValue(metrics.halfOffset);

  useEffect(() => {
    translateY.value = withSpring(
      expandForSelection ? 0 : metrics.halfOffset,
      SPRING,
    );
  }, [expandForSelection, metrics.halfOffset, translateY]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      panStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      const next = panStartY.value + event.translationY;
      translateY.value = Math.min(Math.max(next, 0), metrics.collapsedOffset);
    })
    .onEnd((event) => {
      const projected = translateY.value + event.velocityY * 0.04;
      let target = nearestSnapPoint(projected, [...metrics.snapPoints]);

      if (event.velocityY > 650) {
        const lower = metrics.snapPoints.filter((point) => point >= translateY.value);
        target = lower.length > 0 ? lower[lower.length - 1] : metrics.collapsedOffset;
      } else if (event.velocityY < -650) {
        const higher = metrics.snapPoints.filter((point) => point <= translateY.value);
        target = higher.length > 0 ? higher[0] : 0;
      }

      translateY.value = withSpring(target, SPRING);
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.sheet,
        { height: metrics.expandedHeight, paddingBottom: insets.bottom },
        sheetAnimatedStyle,
      ]}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.sheetDragZone}>
          <View style={styles.sheetHandle} />
          {selectedCard}
          {titleRow}
        </View>
      </GestureDetector>

      <View style={styles.sheetBody}>{children}</View>
    </Animated.View>
  );
}
