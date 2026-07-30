import { SearchField } from '@/components/ui/SearchField';
import { SlidersHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';

type ExploreHeaderProps = {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
  filtersActive?: boolean;
  placeholder?: string;
};

export function ExploreHeader({
  searchTerm,
  onSearchChange,
  onFilterPress,
  filtersActive = false,
  placeholder = 'Search restaurants, bakeries…',
}: ExploreHeaderProps) {
  return (
    <View style={styles.row}>
      <SearchField
        value={searchTerm}
        onChangeText={onSearchChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        returnKeyType="search"
        clearButtonMode="while-editing"
        containerStyle={styles.searchWrap}
        inputStyle={styles.searchInput}
        height={44}
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchWrap: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  searchInput: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  filterButtonActive: {
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.primaryMid,
  },
  pressed: {
    opacity: 0.88,
  },
});
