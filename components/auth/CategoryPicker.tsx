import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PARTNER_CATEGORIES } from '@/constants/partnerCategories';
import { Palette } from '@/constants/Colors';
import type { Locale } from '@/store/useAuthStore';
import type { PartnerCategory } from '@/types/database';

type CategoryPickerProps = {
  value: PartnerCategory | null;
  onChange: (value: PartnerCategory) => void;
  locale: Locale;
  error?: string;
};

export function CategoryPicker({ value, onChange, locale, error }: CategoryPickerProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PARTNER_CATEGORIES.map((cat) => {
          const selected = value === cat.value;
          return (
            <Pressable
              key={cat.value}
              onPress={() => onChange(cat.value)}
              style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {locale === 'np' ? cat.labelNp : cat.labelEn}
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
    marginBottom: 16,
  },
  row: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Palette.white,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
  },
  chipSelected: {
    backgroundColor: Palette.lightGreenBg,
    borderColor: Palette.primary,
  },
  chipText: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Palette.primary,
    fontWeight: '600',
  },
  error: {
    marginTop: 6,
    color: '#DC2626',
    fontSize: 13,
  },
});
