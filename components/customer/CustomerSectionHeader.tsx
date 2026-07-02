import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type CustomerSectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function CustomerSectionHeader({
  title,
  actionLabel,
  onAction,
}: CustomerSectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 28,
    marginBottom: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primary,
  },
});
