import { MessageCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { hapticButtonPress } from '@/lib/haptics';
import { useAppStore } from '@/store/useAppStore';

type MessageIconBadgeProps = {
  onPress: () => void;
  size?: number;
  variant?: 'default' | 'dark';
  compact?: boolean;
};

export function MessageIconBadge({
  onPress,
  size = 18,
  variant = 'default',
  compact = false,
}: MessageIconBadgeProps) {
  const unread = useAppStore((s) => s.unreadMessages);
  const showBadge = unread > 0;
  const isDark = variant === 'dark';
  const label = unread > 9 ? '9+' : String(unread);

  return (
    <Pressable
      onPress={() => {
        void hapticButtonPress();
        onPress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={showBadge ? `Messages, ${unread} unread` : 'Messages'}
      style={[styles.btn, compact && styles.btnCompact, isDark && styles.btnDark]}>
      <MessageCircle size={size} color="#FFFFFF" strokeWidth={2} />
      {showBadge ? (
        isDark ? (
          <View style={styles.dotDark}>
            {unread > 0 ? <Text style={styles.dotText}>{label}</Text> : null}
          </View>
        ) : (
          <View style={[styles.badge, unread > 9 && styles.badgeWide]}>
            <Text style={styles.badgeText}>{label}</Text>
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
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: Palette.primary,
    borderWidth: 1.5,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    color: Palette.white,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeWide: {
    minWidth: 22,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
