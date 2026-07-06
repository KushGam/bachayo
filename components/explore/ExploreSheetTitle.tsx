import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type ExploreSheetTitleProps = {
  count: number;
  locale?: 'en' | 'np';
};

export function ExploreSheetTitle({ count, locale = 'en' }: ExploreSheetTitleProps) {
  const title = locale === 'np' ? 'नजिकका ब्यागहरू' : 'Nearby bags';
  const subtitle =
    count > 0
      ? locale === 'np'
        ? `${count} उपलब्ध आज`
        : `${count} available today`
      : locale === 'np'
        ? 'तपाईंको क्षेत्रमा हेर्नुहोस्'
        : 'In your area';

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    ...Type.h2,
    color: Palette.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
});
