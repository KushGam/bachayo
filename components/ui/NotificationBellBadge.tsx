import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';

import { Palette } from '@/constants/Colors';
import { useAppStore } from '@/store/useAppStore';

type NotificationBellBadgeProps = {
  onPress: () => void;
  color?: string;
  size?: number;
};

export function NotificationBellBadge({
  onPress,
  color = Palette.white,
  size = 20,
}: NotificationBellBadgeProps) {
  const unread = useAppStore((s) => s.unreadNotifications);
  const showCount = unread > 0;

  return (
    <Pressable onPress={onPress} style={styles.btn} hitSlop={8}>
      <Bell size={size} color={color} strokeWidth={2} />
      {showCount ? (
        <View style={[styles.badge, unread > 9 && styles.badgeWide]}>
          <Text style={styles.badgeText}>{unread > 99 ? '99+' : String(unread)}</Text>
        </View>
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
    borderColor: Palette.primary,
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
