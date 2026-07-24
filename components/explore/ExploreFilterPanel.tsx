import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import {
  HOME_CATEGORY_FILTERS,
  type HomeCategoryFilter,
} from '@/constants/partnerCategories';
import type { MaxDistanceKm } from '@/store/useLocationStore';

export const MAX_DISTANCE_OPTIONS: readonly MaxDistanceKm[] = [null, 1, 2, 5, 10];

type ExploreFilterPanelProps = {
  visible: boolean;
  locale: 'en' | 'np';
  selectedCategory: HomeCategoryFilter;
  maxDistanceKm: MaxDistanceKm;
  onSelectCategory: (key: HomeCategoryFilter) => void;
  onSelectDistance: (km: MaxDistanceKm) => void;
  onApply: () => void;
};

function categoryLabel(key: HomeCategoryFilter, locale: 'en' | 'np') {
  const item = HOME_CATEGORY_FILTERS.find((filter) => filter.key === key);
  if (!item) return key;
  return locale === 'np' ? item.labelNp : item.label;
}

export function ExploreFilterPanel({
  visible,
  locale,
  selectedCategory,
  maxDistanceKm,
  onSelectCategory,
  onSelectDistance,
  onApply,
}: ExploreFilterPanelProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(180)}
      style={styles.panel}>
      <Text style={styles.sectionLabel}>Category</Text>
      <View style={styles.pillRow}>
        {HOME_CATEGORY_FILTERS.map((cat) => {
          const active = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => onSelectCategory(cat.key)}
              style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {categoryLabel(cat.key, locale)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Distance</Text>
      <View style={styles.pillRow}>
        {MAX_DISTANCE_OPTIONS.map((km) => {
          const active = maxDistanceKm === km;
          const label = km == null ? (locale === 'np' ? 'सबै' : 'All') : `${km} km`;
          return (
            <Pressable
              key={km == null ? 'all' : String(km)}
              onPress={() => onSelectDistance(km)}
              style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onApply}
        style={({ pressed }) => [styles.applyBtn, pressed && styles.pressed]}>
        <Text style={styles.applyText}>Show results</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    ...CardChrome,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  sectionLabel: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionSpacing: {
    marginTop: Spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    height: 34,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  pillText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  pillTextActive: {
    color: Palette.white,
  },
  applyBtn: {
    marginTop: Spacing.xs,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  applyText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
});
