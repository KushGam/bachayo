import { MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type ExploreSheetEmptyProps = {
  onResetFilters: () => void;
};

export function ExploreSheetEmpty({ onResetFilters }: ExploreSheetEmptyProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <MapPin size={28} color={Palette.primary} strokeWidth={1.8} />
      </View>

      <Text style={styles.title}>No bags in this area</Text>
      <Text style={styles.subtitle}>
        Try expanding your distance or changing the category filter to see more rescue bags nearby.
      </Text>

      <Pressable
        onPress={onResetFilters}
        style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}>
        <Text style={styles.resetText}>Reset filters</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
    maxWidth: 280,
  },
  resetBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  resetText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  pressed: {
    opacity: 0.88,
  },
});
