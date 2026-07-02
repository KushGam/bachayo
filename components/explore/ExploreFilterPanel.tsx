import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import {
  getCategoryPillLabel,
  HOME_CATEGORY_FILTERS,
  type HomeCategoryFilter,
} from '@/constants/partnerCategories';

import { exploreStyles as styles } from './exploreStyles';

const MAX_DISTANCE_OPTIONS = [2, 5, 10, 25] as const;

type ExploreFilterPanelProps = {
  visible: boolean;
  locale: 'en' | 'np';
  selectedCategory: HomeCategoryFilter;
  maxDistanceKm: (typeof MAX_DISTANCE_OPTIONS)[number];
  onSelectCategory: (key: HomeCategoryFilter) => void;
  onSelectDistance: (km: (typeof MAX_DISTANCE_OPTIONS)[number]) => void;
  onApply: () => void;
};

function categoryLabel(key: HomeCategoryFilter, locale: 'en' | 'np') {
  if (key === 'all') return '🍽 All';
  return getCategoryPillLabel(key, locale);
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
      exiting={FadeOutUp.duration(200)}
      style={styles.filterPanelFloating}>
      <Text style={styles.filterSectionLabel}>Category</Text>
      <View style={styles.filterWrap}>
        {HOME_CATEGORY_FILTERS.map((cat) => {
          const active = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => onSelectCategory(cat.key)}
              style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {categoryLabel(cat.key, locale)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.filterSectionLabel, styles.filterSectionSpacing]}>Distance</Text>
      <View style={styles.filterWrap}>
        {MAX_DISTANCE_OPTIONS.map((km) => {
          const active = maxDistanceKm === km;
          return (
            <Pressable
              key={km}
              onPress={() => onSelectDistance(km)}
              style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {km}km
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onApply}
        style={({ pressed }) => [styles.applyFiltersBtn, pressed && { opacity: 0.9 }]}>
        <Text style={styles.applyFiltersText}>Apply filters</Text>
      </Pressable>
    </Animated.View>
  );
}

export { MAX_DISTANCE_OPTIONS };
