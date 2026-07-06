import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationPicker } from '@/components/ui/LocationPicker';
import { NotificationBellBadge } from '@/components/ui/NotificationBellBadge';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { getGreeting, getInitials } from '@/lib/helpers';

type HomeHeroBandProps = {
  userName: string;
  locale: 'en' | 'np';
  areaId: string;
  onLocationChange: (cityId: string, areaId: string) => void;
};

function getGreetingLabel(locale: 'en' | 'np') {
  const hour = new Date().getHours();
  if (locale === 'np') {
    if (hour < 12) return 'शुभ प्रभात';
    if (hour < 17) return 'नमस्ते';
    return 'शुभ साँझ';
  }
  return getGreeting();
}

export function HomeHeroBand({ userName, locale, areaId, onLocationChange }: HomeHeroBandProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = userName.split(/\s+/)[0] || userName;
  const greeting = getGreetingLabel(locale);

  return (
    <LinearGradient
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + Spacing.sm }]}>
      <StatusBar style="light" />

      <View style={styles.glowPrimary} pointerEvents="none" />

      <View style={styles.topRow}>
        <Text style={styles.greeting} numberOfLines={1}>
          {greeting},{' '}
          <Text style={styles.greetingName}>{firstName}</Text>
        </Text>
        <View style={styles.actions}>
          <NotificationBellBadge
            variant="dark"
            compact
            size={16}
            onPress={() => router.push('/notifications')}
          />
          <Pressable
            onPress={() => router.push('/(tabs)/customer/profile')}
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}>
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.locationWrap}>
        <LocationPicker variant="pill" tone="dark" value={areaId} onChange={onLocationChange} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    overflow: 'hidden',
    gap: Spacing.sm,
  },
  glowPrimary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -70,
    right: -50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  greeting: {
    flex: 1,
    ...Type.h2,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  greetingName: {
    color: Palette.white,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  pressed: {
    opacity: 0.88,
  },
  locationWrap: {
    alignSelf: 'flex-start',
  },
});
