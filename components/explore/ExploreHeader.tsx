import { AppSymbol } from '@/components/ui/AppSymbol';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { SlidersHorizontal } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';

import { Palette } from '@/constants/Colors';

import { exploreStyles as styles } from './exploreStyles';

type ExploreHeaderProps = {
  areaId: string | null | undefined;
  onLocationChange: (cityId: string, areaId: string) => void;
  searchTerm: string;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
  paddingTop: number;
};

export function ExploreHeader({
  areaId,
  onLocationChange,
  searchTerm,
  onSearchChange,
  onFilterPress,
  paddingTop,
}: ExploreHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop }]}>
      <LocationPicker variant="explore" value={areaId} onChange={onLocationChange} />

      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <AppSymbol ios="magnifyingglass" android="search" size={18} color={Palette.textSecondary} />
          <TextInput
            value={searchTerm}
            onChangeText={onSearchChange}
            placeholder="Search restaurants, bakeries..."
            placeholderTextColor={Palette.textSecondary}
            style={styles.searchInput}
          />
        </View>
        <Pressable onPress={onFilterPress} style={styles.filterButton}>
          <SlidersHorizontal size={20} color={Palette.primary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
