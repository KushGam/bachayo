import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

type ExploreSheetTitleProps = {
  count: number;
  locale?: 'en' | 'np';
};

export function ExploreSheetTitle({ count, locale = 'en' }: ExploreSheetTitleProps) {
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
      <Text style={[styles.title, count === 0 && styles.titleEmpty]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  titleEmpty: {
    color: '#6B7280',
    fontWeight: '500',
  },
});
