import type { LucideIcon } from 'lucide-react-native';
import { Leaf } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon: Icon = Leaf,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={28} color={Palette.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
});
