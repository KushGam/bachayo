import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { AppSymbol } from '@/components/ui/AppSymbol';

type CustomerSectionHeaderProps = {
  title: string;
  subtitle?: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
};

export function CustomerSectionHeader({
  title,
  subtitle,
  count,
  actionLabel,
  onAction,
}: CustomerSectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {count != null && count > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
          <Text style={styles.action}>{actionLabel}</Text>
          <AppSymbol ios="chevron.right" android="chevron-right" size={12} color={Palette.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 1,
  },
  action: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
