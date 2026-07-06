import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';

import { useAppStore } from '@/store/useAppStore';

type NotificationBellBadgeProps = {
  onPress: () => void;
  color?: string;
  size?: number;
  variant?: 'default' | 'dark';
};

export function NotificationBellBadge({
  onPress,
  color = '#FFFFFF',
  size = 18,
  variant = 'default',
}: NotificationBellBadgeProps) {
  const unread = useAppStore((s) => s.unreadNotifications);
  const showCount = unread > 0;
  const isDark = variant === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, isDark && styles.btnDark]}
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
  btnDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dotDark: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D85A30',
    borderWidth: 2,
    borderColor: '#1A1A1A',
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
