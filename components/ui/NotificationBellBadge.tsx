import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';

import { Palette } from '@/constants/Colors';
import { useAppStore } from '@/store/useAppStore';

type NotificationBellBadgeProps = {
  onPress: () => void;
  color?: string;
  size?: number;
  variant?: 'default' | 'dark';
  compact?: boolean;
};

export function NotificationBellBadge({
  onPress,
  color = '#FFFFFF',
  size = 18,
  variant = 'default',
  compact = false,
}: NotificationBellBadgeProps) {
  const unread = useAppStore((s) => s.unreadNotifications);
  const showCount = unread > 0;
  const isDark = variant === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, compact && styles.btnCompact, isDark && styles.btnDark]}
      hitSlop={8}>
      <Bell size={size} color={color} strokeWidth={2} />
      {showCount ? (
        isDark ? (
          <View style={styles.dotDark} />
        ) : (
          <View style={[styles.badge, unread > 9 && styles.badgeWide]}>
            <Text style={styles.badgeText}>{unread > 99 ? '99+' : String(unread)}</Text>
          </View>
        )
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  btnDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  dotDark: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.primary,
    borderWidth: 2,
    borderColor: Palette.white,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#D85A30',
  },
  badgeWide: {
    minWidth: 22,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 12,
  },
});
