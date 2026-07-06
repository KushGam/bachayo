import { LocationPicker } from '@/components/ui/LocationPicker';
import { SearchField } from '@/components/ui/SearchField';
import { SlidersHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing } from '@/constants/theme';

type ExploreHeaderProps = {
  areaId: string | null | undefined;
  onLocationChange: (cityId: string, areaId: string) => void;
  searchTerm: string;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
  filtersActive?: boolean;
  placeholder?: string;
};

export function ExploreHeader({
  areaId,
  onLocationChange,
  searchTerm,
  onSearchChange,
  onFilterPress,
  filtersActive = false,
  placeholder = 'Search restaurants, bakeries…',
}: ExploreHeaderProps) {
  return (
    <View style={styles.card}>
      <LocationPicker variant="explore" value={areaId} onChange={onLocationChange} />

      <View style={styles.searchRow}>
        <SearchField
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          returnKeyType="search"
          clearButtonMode="while-editing"
          containerStyle={styles.searchWrap}
        />
        <Pressable
          onPress={onFilterPress}
          style={({ pressed }) => [
            styles.filterButton,
            filtersActive && styles.filterButtonActive,
            pressed && styles.pressed,
          ]}>
          <SlidersHorizontal
            size={18}
            color={filtersActive ? Palette.primaryDark : Palette.primary}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchWrap: {
    flex: 1,
    backgroundColor: Palette.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    height: 44,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: Palette.primaryLightAlt,
    borderColor: Palette.primaryMid,
  },
  pressed: {
    opacity: 0.88,
  },
});
