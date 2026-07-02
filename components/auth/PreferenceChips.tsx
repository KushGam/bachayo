import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FOOD_PREFERENCE_OPTIONS } from '@/constants/foodPreferences';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type PreferenceChipsProps = {
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function PreferenceChips({ selected, onChange }: PreferenceChipsProps) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((item) => item !== key));
      return;
    }
    onChange([...selected, key]);
  };

  return (
    <View style={styles.wrap}>
      {FOOD_PREFERENCE_OPTIONS.map((option) => {
        const active = selected.includes(option.key);
        return (
          <Pressable
            key={option.key}
            onPress={() => toggle(option.key)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  chipActive: {
    backgroundColor: Palette.lightGreenBg,
    borderColor: Palette.primary,
  },
  chipText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  chipTextActive: {
    color: Palette.primaryDark,
  },
});
