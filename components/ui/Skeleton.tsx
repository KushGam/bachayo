import { Palette } from '@/constants/Colors';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function BagCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={180} borderRadius={0} style={styles.image} />
      <View style={styles.body}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="90%" height={14} style={{ marginTop: 10 }} />
        <Skeleton width="40%" height={20} style={{ marginTop: 12 }} />
        <Skeleton width="70%" height={12} style={{ marginTop: 10 }} />
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
      <Skeleton width={52} height={52} borderRadius={10} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="40%" height={13} />
        <Skeleton width="30%" height={20} borderRadius={999} />
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
          <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.lightGreenBg,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    marginBottom: 14,
  },
  image: {
    width: '100%',
  },
  body: {
    padding: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  orderCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 14,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: Palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 14,
  },
});
