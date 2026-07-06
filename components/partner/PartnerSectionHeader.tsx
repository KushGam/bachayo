import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#D85A30',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D85A30',
  },
});
