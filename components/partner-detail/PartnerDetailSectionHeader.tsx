import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type PartnerDetailSectionHeaderProps = {
  title: string;
  badge?: string;
  trailing?: string;
};

export function PartnerDetailSectionHeader({
  title,
  badge,
  trailing,
}: PartnerDetailSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.white,
  },
  trailing: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
});
