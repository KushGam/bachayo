import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type ProfileMenuRowProps = {
  emoji?: string;
  icon?: LucideIcon;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
  labelColor?: string;
};

export function ProfileMenuRow({
  emoji,
  icon: Icon,
  label,
  subtitle,
  onPress,
  right,
  showChevron = true,
  isLast = false,
  labelColor = Palette.textPrimary,
}: ProfileMenuRowProps) {
  const interactive = Boolean(onPress);

  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        interactive && pressed && styles.rowPressed,
      ]}>
      <View style={styles.iconWrap}>
        {Icon ? (
          <Icon size={16} color={Palette.primary} strokeWidth={2} />
        ) : (
          <Text style={styles.emoji}>{emoji}</Text>
        )}
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right}
      {showChevron && interactive && !right ? (
        <ChevronRight size={16} color={Palette.textTertiary} strokeWidth={2.5} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowPressed: {
    backgroundColor: Palette.surfaceMuted,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 16,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...Type.bodyMedium,
    fontWeight: '600',
  },
  subtitle: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
});
