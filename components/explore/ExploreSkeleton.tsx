import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/theme';

export function ExploreSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <View style={[styles.floatingChrome, { paddingTop: insets.top + Spacing.sm }]}>
          <Skeleton height={92} borderRadius={Radius.lg} />
        </View>
      </View>
      <View style={styles.sheet}>
        <Skeleton width={40} height={4} borderRadius={2} style={styles.handle} />
        <Skeleton width="45%" height={18} style={styles.title} />
        <Skeleton width="60%" height={14} style={styles.subtitle} />
        <View style={styles.sheetContent}>
          <ListSkeleton count={4} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  mapArea: {
    flex: 1,
    backgroundColor: Palette.surfaceMuted,
    position: 'relative',
  },
  floatingChrome: {
    paddingHorizontal: Spacing.lg,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 280,
    height: '50%',
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.lg + 8,
    borderTopRightRadius: Radius.lg + 8,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  handle: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sheetContent: {
    paddingHorizontal: Spacing.lg,
  },
});
