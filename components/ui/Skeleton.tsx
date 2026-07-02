import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/theme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = Radius.sm,
  style,
}: SkeletonProps) {
  const shimmer = useSharedValue(0.35);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return (
    <Animated.View
      style={[styles.base, { width, height, borderRadius }, animatedStyle, style]}
    />
  );
}

export function BagCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={180} borderRadius={0} style={styles.image} />
      <View style={styles.body}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="90%" height={14} style={{ marginTop: Spacing.md }} />
        <Skeleton width="40%" height={20} style={{ marginTop: Spacing.md }} />
        <Skeleton width="70%" height={12} style={{ marginTop: Spacing.md }} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <BagCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <Skeleton width={52} height={52} borderRadius={Radius.md} />
      <View style={{ flex: 1, gap: Spacing.sm }}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="40%" height={13} />
        <Skeleton width="30%" height={20} borderRadius={Radius.pill} />
      </View>
    </View>
  );
}

export function StatsSkeleton() {
  return (
    <View style={styles.statsGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.statCard}>
          <Skeleton width="50%" height={22} />
          <Skeleton width="70%" height={12} style={{ marginTop: Spacing.sm }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.imagePlaceholder,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
  },
  body: {
    padding: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  orderCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    padding: Spacing.md,
  },
});
