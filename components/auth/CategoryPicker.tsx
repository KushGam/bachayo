import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  PARTNER_CATEGORIES,
  type PartnerCategoryOption,
} from '@/constants/partnerCategories';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import type { Locale } from '@/store/useAuthStore';

type CategoryPickerProps = {
  value: PartnerCategoryOption | null;
  onChange: (value: PartnerCategoryOption) => void;
  locale: Locale;
  error?: string;
};

export function CategoryPicker({ value, onChange, locale, error }: CategoryPickerProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PARTNER_CATEGORIES.map((cat) => {
          const selected = value === cat.id;
          const label = locale === 'np' ? cat.labelNp : cat.label;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onChange(cat.id)}
              style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {cat.icon} {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.lg,
  },
  row: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  chipSelected: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  chipText: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Palette.white,
    fontWeight: '600',
  },
  error: {
    marginTop: Spacing.sm,
    ...Type.caption,
    color: Palette.dangerText,
  },
});
