import { Pressable, Text, View } from 'react-native';

import { exploreStyles as styles } from './exploreStyles';

type ExploreSheetEmptyProps = {
  onResetFilters: () => void;
};

export function ExploreSheetEmpty({ onResetFilters }: ExploreSheetEmptyProps) {
  return (
    <View style={styles.sheetEmpty}>
      <View style={styles.sheetEmptyIcon}>
        <Text style={styles.sheetEmptyEmoji}>📍</Text>
      </View>

      <Text style={styles.sheetEmptyTitle}>No bags in this area</Text>

      <Text style={styles.sheetEmptySubtitle}>
        Try expanding your distance{'\n'}
        or changing the category filter
      </Text>

      <Pressable
        onPress={onResetFilters}
        style={({ pressed }) => [styles.resetFiltersBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.resetFiltersText}>Reset filters</Text>
      </Pressable>
    </View>
  );
}
