import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/Skeleton';

export function PartnerDetailSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <Skeleton height={260} borderRadius={0} />
      <View style={[styles.headerButtons, { top: insets.top + 12 }]}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <Skeleton width={36} height={36} borderRadius={18} />
      </View>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Skeleton width={80} height={48} borderRadius={12} />
          <Skeleton width={80} height={48} borderRadius={12} />
          <Skeleton width={80} height={48} borderRadius={12} />
        </View>
      </View>
      <View style={styles.section}>
        <Skeleton width="40%" height={18} />
        <Skeleton width="100%" height={14} style={{ marginTop: 12 }} />
        <Skeleton width="92%" height={14} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.section}>
        <Skeleton width="55%" height={18} />
        <Skeleton height={90} borderRadius={16} style={{ marginTop: 12 }} />
        <Skeleton height={90} borderRadius={16} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  headerButtons: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCard: {
    marginTop: -24,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
  },
});
