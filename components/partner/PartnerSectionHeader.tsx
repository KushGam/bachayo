import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

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
  const showBadge = count != null && count > 0;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.accent} />
        <Text style={styles.title}>{title}</Text>
        {showBadge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {count} {countSuffix}
            </Text>
          </View>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onAction();
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.75 }]}>
          <Text style={styles.action}>{actionLabel}</Text>
          <ChevronRight size={14} color={Palette.primary} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm + 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  accent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    color: Palette.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.overlay.border,
  },
  badgeText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  action: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
});
