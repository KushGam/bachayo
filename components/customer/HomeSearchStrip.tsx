import { Map } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SearchField } from '@/components/ui/SearchField';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

type HomeSearchStripProps = {
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

export function HomeSearchStrip({
  placeholder,
  mapLabel,
  value,
  isSearching,
  cancelLabel,
  onChangeText,
  onFocus,
  onCancel,
  onMapPress,
}: HomeSearchStripProps) {
  return (
    <View style={styles.strip}>
      <View style={styles.card}>
        <SearchField
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          autoFocus={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          containerStyle={styles.searchArea}
        />

        <View style={styles.divider} />

        <Pressable
          onPress={onMapPress}
          accessibilityLabel={mapLabel}
          style={({ pressed }) => [styles.mapBtn, pressed && styles.pressed]}>
          <Map size={17} color={Palette.primary} strokeWidth={2.2} />
          <Text style={styles.mapLabel}>{mapLabel}</Text>
        </Pressable>
      </View>

      {isSearching ? (
        <Pressable onPress={onCancel} hitSlop={8} style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}>
          <Text style={styles.cancel}>{cancelLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    height: 48,
    ...FloatingShadow,
  },
  searchArea: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    backgroundColor: Palette.surface,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Palette.borderSubtle,
  },
  mapBtn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: Palette.primaryLight,
  },
  mapLabel: {
    ...Type.label,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  cancelBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.xs,
  },
  cancel: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.primary,
  },
  pressed: {
    opacity: 0.88,
  },
});
