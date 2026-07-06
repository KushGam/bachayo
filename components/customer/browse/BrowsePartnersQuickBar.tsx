import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

export type BrowseSortKey = 'nearest' | 'rating' | 'bags';

type BrowsePartnersQuickBarProps = {
  locale: 'en' | 'np';
  sortBy: BrowseSortKey;
  onSortChange: (key: BrowseSortKey) => void;
  bagsTodayOnly: boolean;
  onBagsTodayOnlyChange: (value: boolean) => void;
  embedded?: boolean;
};

const SORT_OPTIONS: { key: BrowseSortKey; labelEn: string; labelNp: string }[] = [
  { key: 'nearest', labelEn: 'Nearest', labelNp: 'नजिक' },
  { key: 'rating', labelEn: 'Top rated', labelNp: 'रेटिङ' },
  { key: 'bags', labelEn: 'Most bags', labelNp: 'ब्याग' },
];

export function BrowsePartnersQuickBar({
  locale,
  sortBy,
  onSortChange,
  bagsTodayOnly,
  onBagsTodayOnlyChange,
  embedded = false,
}: BrowsePartnersQuickBarProps) {
  const isNp = locale === 'np';

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onBagsTodayOnlyChange(!bagsTodayOnly);
          }}
          style={[styles.chip, bagsTodayOnly && styles.chipActive]}>
          <View style={[styles.dot, bagsTodayOnly && styles.dotActive]} />
          <Text style={[styles.chipText, bagsTodayOnly && styles.chipTextActive]}>
            {isNp ? 'आज सूची' : 'Live today'}
          </Text>
        </Pressable>

        {SORT_OPTIONS.map((option) => {
          const active = sortBy === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                void hapticButtonPress();
                onSortChange(option.key);
              }}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {isNp ? option.labelNp : option.labelEn}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  wrapEmbedded: {
    paddingHorizontal: 0,
  },
  row: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  chipActive: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Palette.textTertiary,
  },
  dotActive: {
    backgroundColor: Palette.success,
  },
  chipText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  chipTextActive: {
    color: Palette.primaryDark,
    fontWeight: '700',
  },
});
