import { BarChart3, Plus, QrCode, ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type DashboardQuickActionsProps = {
  onScan: () => void;
  onMyBags: () => void;
  onReports: () => void;
  onAddBag: () => void;
  waitingCount?: number;
};

function QuickAction({
  icon: Icon,
  label,
  hint,
  onPress,
  primary = false,
  badge,
}: {
  icon: typeof QrCode;
  label: string;
  hint?: string;
  onPress: () => void;
  primary?: boolean;
  badge?: number;
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
          strokeWidth={2.2}
        />
        {badge != null && badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, primary && styles.labelPrimary]} numberOfLines={1}>
        {label}
      </Text>
      {hint ? (
        <Text style={[styles.hint, primary && styles.hintPrimary]} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function DashboardQuickActions({
  onScan,
  onMyBags,
  onReports,
  onAddBag,
  waitingCount = 0,
}: DashboardQuickActionsProps) {
  return (
    <View style={styles.row}>
      <QuickAction
        icon={QrCode}
        label="Scan"
        hint="Confirm pickup"
        onPress={onScan}
        primary
        badge={waitingCount}
      />
      <QuickAction icon={ShoppingBag} label="My bags" hint="Manage listings" onPress={onMyBags} />
      <QuickAction icon={BarChart3} label="Reports" hint="Pull insights" onPress={onReports} />
      <QuickAction icon={Plus} label="Add bag" hint="List surplus" onPress={onAddBag} />
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
    borderRadius: 16,
    paddingVertical: Spacing.md,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
    ...FloatingShadow,
  },
  actionPrimary: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.primary,
  },
  label: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  labelPrimary: {
    color: Palette.white,
  },
  hint: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    color: Palette.textTertiary,
    textAlign: 'center',
  },
  hintPrimary: {
    color: 'rgba(255,255,255,0.72)',
  },
});
