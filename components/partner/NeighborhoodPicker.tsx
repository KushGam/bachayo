import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { KATHMANDU_NEIGHBORHOODS, type KathmanduNeighborhood } from '@/constants/partnerAreas';
import { Palette } from '@/constants/Colors';

type NeighborhoodPickerProps = {
  value: KathmanduNeighborhood | null;
  onChange: (value: KathmanduNeighborhood) => void;
  error?: string;
};

export function NeighborhoodPicker({ value, onChange, error }: NeighborhoodPickerProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {KATHMANDU_NEIGHBORHOODS.map((area) => {
          const selected = value === area;
          return (
            <Pressable
              key={area}
              onPress={() => onChange(area)}
              style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{area}</Text>
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
    color: Palette.primaryDark,
    fontWeight: '600',
  },
  error: {
    marginTop: 6,
    color: Palette.danger,
    fontSize: 13,
  },
});
