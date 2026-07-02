import { StyleSheet, View } from 'react-native';

import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';

export function ExploreSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton height={36} borderRadius={999} width="55%" />
        <Skeleton height={48} borderRadius={14} />
      </View>
      <View style={styles.mapArea} />
      <View style={styles.sheet}>
        <Skeleton width={36} height={4} borderRadius={2} style={styles.handle} />
        <Skeleton width="50%" height={16} style={{ marginBottom: Spacing.md, marginHorizontal: 16 }} />
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Palette.white,
    gap: 10,
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#E8E4DC',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 280,
    height: '50%',
    backgroundColor: Palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetContent: {
    paddingHorizontal: 16,
  },
});
