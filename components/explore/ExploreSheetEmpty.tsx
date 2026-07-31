import { MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';

type ExploreSheetEmptyProps = {
  locale?: 'en' | 'np';
};

/** Compact empty copy — Reset lives in the sheet title so it stays above the fold. */
export function ExploreSheetEmpty({ locale = 'en' }: ExploreSheetEmptyProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <MapPin size={22} color={Palette.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.subtitle}>
        {locale === 'np'
          ? 'दूरी बढाउनुहोस् वा श्रेणी फिल्टर बदल्नुहोस्।'
          : 'Try a wider distance or another category filter.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...Type.caption,
    flex: 1,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
});
