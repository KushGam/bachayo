import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing } from '@/constants/theme';

function BrowsePartnerCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={72} height={72} borderRadius={Radius.md} />
      <View style={styles.body}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: Spacing.sm }} />
        <Skeleton width="55%" height={12} style={{ marginTop: Spacing.sm }} />
        <Skeleton width="36%" height={22} borderRadius={Radius.pill} style={{ marginTop: Spacing.sm }} />
      </View>
    </View>
  );
}

export function BrowsePartnersSkeleton({
  count = 4,
  embedded = false,
}: {
  count?: number;
  embedded?: boolean;
}) {
  return (
    <View style={[styles.list, embedded && styles.listEmbedded]}>
      {Array.from({ length: count }).map((_, index) => (
        <BrowsePartnerCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  listEmbedded: {
    paddingHorizontal: 0,
  },
  card: {
    ...CardChrome,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  body: {
    flex: 1,
  },
});
