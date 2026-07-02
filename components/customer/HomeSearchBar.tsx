import { AppSymbol } from '@/components/ui/AppSymbol';
import { Palette } from '@/constants/Colors';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type HomeSearchBarProps = {
  placeholder: string;
  mapLabel: string;
  value: string;
  isSearching: boolean;
  cancelLabel: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onCancel: () => void;
  onMapPress: () => void;
};

export function HomeSearchBar({
  placeholder,
  mapLabel,
  value,
  isSearching,
  cancelLabel,
  onChangeText,
  onFocus,
  onCancel,
  onMapPress,
}: HomeSearchBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.search}>
        <AppSymbol ios="magnifyingglass" android="search" size={18} color={Palette.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor={Palette.textSecondary}
          autoFocus={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={styles.input}
        />
      </View>
      {isSearching ? (
        <Pressable onPress={onCancel} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.cancel}>{cancelLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onMapPress}
        accessibilityLabel={mapLabel}
        style={({ pressed }) => [styles.mapBtn, pressed && styles.pressed]}>
        <AppSymbol ios="map.fill" android="map" size={20} color={Palette.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Palette.textPrimary,
    paddingVertical: 0,
    ...Platform.select({
      android: { paddingVertical: 0 },
      default: {},
    }),
  },
  cancel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.white,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
});
