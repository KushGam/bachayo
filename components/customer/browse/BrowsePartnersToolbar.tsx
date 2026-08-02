import { Map, X } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { SearchField } from '@/components/ui/SearchField';
import { Palette } from '@/constants/Colors';
import { CardChrome, Radius, Spacing } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type BrowsePartnersToolbarProps = {
  locale: 'en' | 'np';
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onMapPress: () => void;
  embedded?: boolean;
};

export function BrowsePartnersToolbar({
  locale,
  value,
  onChangeText,
  onClear,
  onMapPress,
  embedded = false,
}: BrowsePartnersToolbarProps) {
  const isNp = locale === 'np';

  return (
    <View style={[styles.strip, embedded && styles.stripEmbedded]}>
      <View style={styles.card}>
        <SearchField
          value={value}
          onChangeText={onChangeText}
          placeholder={isNp ? 'रेस्टुरेन्टको नाम खोज्नुहोस्…' : 'Search restaurants…'}
          returnKeyType="search"
          clearButtonMode="while-editing"
          containerStyle={styles.searchArea}
          trailing={
            value.length > 0 && Platform.OS === 'android' ? (
              <Pressable onPress={onClear} hitSlop={8}>
                <X size={16} color={Palette.textTertiary} strokeWidth={2} />
              </Pressable>
            ) : null
          }
        />

        <View style={styles.divider} />

        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onMapPress();
          }}
          accessibilityLabel={isNp ? 'नक्सा' : 'Map'}
          style={({ pressed }) => [styles.mapBtn, pressed && styles.pressed]}>
          <Map size={18} color={Palette.primary} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: Palette.background,
  },
  stripEmbedded: {
    paddingHorizontal: 0,
    paddingTop: Spacing.md,
  },
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    height: 48,
    backgroundColor: Palette.surface,
  },
  searchArea: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    backgroundColor: Palette.surface,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: Palette.border,
  },
  mapBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primaryLight,
  },
  pressed: {
    opacity: 0.88,
  },
});
