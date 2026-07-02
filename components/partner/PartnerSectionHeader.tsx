import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type PartnerSectionHeaderProps = {
  title: string;
  count?: number;
  countSuffix?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function PartnerSectionHeader({
  title,
  count,
  countSuffix = 'bags',
  actionLabel,
  onAction,
}: PartnerSectionHeaderProps) {
  const showBadge = count != null;

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>
        {showBadge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {count} {countSuffix}
            </Text>
          </View>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: Palette.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.white,
  },
  action: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
  },
});
