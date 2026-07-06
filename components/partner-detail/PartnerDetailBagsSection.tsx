import { StyleSheet, Text, View } from 'react-native';

import { PartnerDetailBagCard } from '@/components/partner-detail/PartnerDetailBagCard';
import { PartnerDetailSectionHeader } from '@/components/partner-detail/PartnerDetailSectionHeader';
import { Palette } from '@/constants/Colors';
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';
import type { RescueBag } from '@/types/database';

type PartnerDetailBagsSectionProps = {
  bags: RescueBag[];
  onLayout: (y: number) => void;
  onReserve: (bagId: string) => void;
};

export function PartnerDetailBagsSection({ bags, onLayout, onReserve }: PartnerDetailBagsSectionProps) {
  return (
    <View
      onLayout={(event) => {
        onLayout(event.nativeEvent.layout.y);
      }}>
      <View style={styles.headerWrap}>
        <PartnerDetailSectionHeader
          title="Today's rescue bags"
          badge={`${bags.length} bag${bags.length === 1 ? '' : 's'}`}
        />
      </View>

      {bags.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No rescue bags today</Text>
          <Text style={styles.emptySubtitle}>
            Check back later — bags usually appear between 5–9pm
          </Text>
        </View>
      ) : (
        bags.map((bag) => (
          <PartnerDetailBagCard key={bag.id} bag={bag} onReserve={() => onReserve(bag.id)} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  emptyCard: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  emptySubtitle: {
    marginTop: Spacing.sm,
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
