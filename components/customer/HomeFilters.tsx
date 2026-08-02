import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';
import type { HomeCategoryFilter } from '@/constants/partnerCategories';
import type { MaxDistanceKm } from '@/store/useLocationStore';

type CategoryOption = {
  key: HomeCategoryFilter;
  label: string;
};

export const HOME_DISTANCE_OPTIONS: readonly MaxDistanceKm[] = [null, 1, 2, 5, 10];

type HomeFiltersProps = {
  categories: CategoryOption[];
  selectedCategory: HomeCategoryFilter;
  onCategoryChange: (key: HomeCategoryFilter) => void;
  distances?: readonly MaxDistanceKm[];
  maxDistanceKm: MaxDistanceKm;
  onDistanceChange: (km: MaxDistanceKm) => void;
  locale: 'en' | 'np';
  embedded?: boolean;
};

export function HomeFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  distances = HOME_DISTANCE_OPTIONS,
  maxDistanceKm,
  onDistanceChange,
  locale,
  embedded = false,
}: HomeFiltersProps) {
  return (
    <View style={[styles.card, embedded && styles.cardEmbedded]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}>
        {categories.map((pill) => {
          const active = pill.key === selectedCategory;
          return (
            <Pressable
              key={pill.key}
              onPress={() => {
                void hapticButtonPress();
                onCategoryChange(pill.key);
              }}
              style={[styles.categoryChip, active && styles.categoryChipActive]}>
              <Text
                numberOfLines={1}
                style={[styles.categoryText, active && styles.categoryTextActive]}>
                {pill.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.distanceTrack}>
        {distances.map((km) => {
          const active = maxDistanceKm === km;
          const label =
            km == null
              ? locale === 'np'
                ? 'सबै'
                : 'All'
              : `${km}km`;
          return (
            <Pressable
              key={km == null ? 'all' : String(km)}
              onPress={() => {
                void hapticButtonPress();
                onDistanceChange(km);
              }}
              style={[styles.distanceSegment, active && styles.distanceSegmentActive]}>
              <Text style={[styles.distanceText, active && styles.distanceTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  cardEmbedded: {
    marginHorizontal: 0,
  },
  categoryRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  categoryChip: {
    height: 34,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  categoryText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  categoryTextActive: {
    color: Palette.white,
    fontWeight: '700',
  },
  distanceTrack: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.md,
    padding: 3,
  },
  distanceSegment: {
    flex: 1,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceSegmentActive: {
    backgroundColor: Palette.surface,
  },
  distanceText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  distanceTextActive: {
    color: Palette.primaryDark,
    fontWeight: '700',
  },
});
