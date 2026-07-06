import { Mail, MessageCircle, ShoppingBag, Store, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SearchField } from '@/components/ui/SearchField';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type HelpSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function HelpSearchBar({ value, onChangeText }: HelpSearchBarProps) {
  return (
    <View style={styles.searchStrip}>
      <SearchField
        value={value}
        onChangeText={onChangeText}
        placeholder="Search help topics…"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        containerStyle={styles.bar}
        trailing={
          value.length > 0 ? (
            <Pressable
              onPress={() => {
                void hapticButtonPress();
                onChangeText('');
              }}
              hitSlop={8}
              style={styles.clear}>
              <X size={14} color={Palette.textTertiary} strokeWidth={2.5} />
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

type HelpQuickLink = {
  key: string;
  label: string;
  icon: typeof Mail;
  iconColor: string;
  onPress: () => void;
};

type HelpQuickLinksProps = {
  links: HelpQuickLink[];
};

export function HelpQuickLinks({ links }: HelpQuickLinksProps) {
  return (
    <View style={styles.quickLinksWrap}>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Pressable
            key={link.key}
            onPress={link.onPress}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
            <Icon size={15} color={link.iconColor} strokeWidth={2.2} />
            <Text style={styles.chipText}>{link.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { Mail, MessageCircle, ShoppingBag, Store };

const styles = StyleSheet.create({
  searchStrip: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  quickLinksWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  bar: {
    width: '100%',
    ...CardChrome,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  clear: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  chipPressed: {
    opacity: 0.9,
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
  },
  chipText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
});
