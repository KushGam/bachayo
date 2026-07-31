import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type ExploreSheetTitleProps = {
  count: number;
  locale?: 'en' | 'np';
  onResetFilters?: () => void;
};

export function ExploreSheetTitle({
  count,
  locale = 'en',
  onResetFilters,
}: ExploreSheetTitleProps) {
  const title =
    count > 0
      ? locale === 'np'
        ? `🛍 ${count} ब्याग नजिकै`
        : `🛍 ${count} bag${count === 1 ? '' : 's'} near you`
      : locale === 'np'
        ? 'अहिले नजिकै ब्याग छैन'
        : 'No bags nearby right now';

  return (
    <View style={styles.row}>
      <Text style={[styles.title, count === 0 && styles.titleEmpty]} numberOfLines={1}>
        {title}
      </Text>
      {count === 0 && onResetFilters ? (
        <Pressable
          onPress={onResetFilters}
          hitSlop={8}
          style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}>
          <Text style={styles.resetText}>
            {locale === 'np' ? 'रिसेट' : 'Reset filters'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  titleEmpty: {
    color: '#6B7280',
    fontWeight: '500',
  },
  resetBtn: {
    flexShrink: 0,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  resetText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primaryDark,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.88,
  },
});
