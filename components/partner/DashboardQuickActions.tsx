import { QrCode, ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type DashboardQuickActionsProps = {
  onScan: () => void;
  onMyBags: () => void;
};

function QuickAction({
  icon: Icon,
  label,
  onPress,
  primary = false,
}: {
  icon: typeof QrCode;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        void hapticButtonPress();
        onPress();
      }}
      style={({ pressed }) => [
        styles.action,
        primary && styles.actionPrimary,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, primary && styles.iconWrapPrimary]}>
        <Icon
          size={18}
          color={primary ? Palette.white : Palette.primary}
          strokeWidth={2}
        />
      </View>
      <Text style={[styles.label, primary && styles.labelPrimary]}>{label}</Text>
    </Pressable>
  );
}

export function DashboardQuickActions({ onScan, onMyBags }: DashboardQuickActionsProps) {
  return (
    <View style={styles.row}>
      <QuickAction icon={QrCode} label="Scan pickup" onPress={onScan} primary />
      <QuickAction icon={ShoppingBag} label="My bags" onPress={onMyBags} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  action: {
    flex: 1,
    ...CardChrome,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 6,
    ...FloatingShadow,
  },
  actionPrimary: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapPrimary: {
    backgroundColor: Palette.primary,
  },
  label: {
    ...Type.label,
    fontWeight: '600',
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  labelPrimary: {
    color: Palette.primaryDark,
  },
});
