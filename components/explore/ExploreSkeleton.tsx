import { StyleSheet, View } from 'react-native';

import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';

export function ExploreSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder} />
      <View style={styles.overlay}>
        <Skeleton height={48} borderRadius={12} />
      </View>
      <View style={styles.sheet}>
        <Skeleton width={44} height={5} borderRadius={999} style={styles.handle} />
        <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
        <ListSkeleton count={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Palette.lightGreenBg,
  },
  overlay: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: Palette.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Palette.lightGreenBg,
  },
  handle: {
    alignSelf: 'center',
    marginBottom: 10,
  },
});
