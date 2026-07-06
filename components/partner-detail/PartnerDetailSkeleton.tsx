import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/theme';

export function PartnerDetailSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <Skeleton height={248} borderRadius={0} />
      <View style={[styles.headerButtons, { top: insets.top + Spacing.md }]}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <Skeleton width={36} height={36} borderRadius={18} />
      </View>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Skeleton width={80} height={56} borderRadius={Radius.md} />
          <Skeleton width={80} height={56} borderRadius={Radius.md} />
          <Skeleton width={80} height={56} borderRadius={Radius.md} />
        </View>
      </View>
      <View style={styles.section}>
        <Skeleton width="40%" height={18} />
        <Skeleton width="100%" height={14} style={{ marginTop: Spacing.md }} />
        <Skeleton width="92%" height={14} style={{ marginTop: Spacing.sm }} />
      </View>
      <View style={styles.section}>
        <Skeleton width="55%" height={18} />
        <Skeleton height={92} borderRadius={Radius.lg} style={{ marginTop: Spacing.md }} />
        <Skeleton height={92} borderRadius={Radius.lg} style={{ marginTop: Spacing.sm }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  headerButtons: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCard: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
});
