import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { MessageIconBadge } from '@/components/ui/MessageIconBadge';
import { NotificationBellBadge } from '@/components/ui/NotificationBellBadge';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { getGreeting, getInitials } from '@/lib/helpers';

type HomeHeroBandProps = {
  userName: string;
  locale: 'en' | 'np';
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

function getGreetingSubline(locale: 'en' | 'np') {
  const hour = new Date().getHours();
  if (locale === 'np') {
    if (hour < 12) return 'आजका रेस्क्यु ब्यागहरू तयार छन्';
    if (hour < 17) return 'नजिकैका ब्याग खोज्नुहोस्';
    return 'आजको बचेको खाना बचाऔं';
  }
  if (hour < 12) return 'Fresh rescue bags are waiting nearby';
  if (hour < 17) return 'See what’s left near you today';
  return 'Turn tonight’s surplus into dinner';
}

export function HomeHeroBand({ userName, locale }: HomeHeroBandProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = userName.split(/\s+/)[0] || userName;
  const greeting = getGreetingLabel(locale);
  const subline = getGreetingSubline(locale);

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={['#5C220F', Palette.primaryDarker, Palette.primaryDark, '#C24E28']}
        locations={[0, 0.28, 0.62, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + Spacing.md }]}>
        <StatusBar style="light" />

        {/* Atmospheric depth */}
        <View style={styles.glowTop} pointerEvents="none" />
        <View style={styles.glowSide} pointerEvents="none" />
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.02)', 'transparent']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 0.7 }}
          style={styles.sheen}
          pointerEvents="none"
        />
        <View style={styles.grain} pointerEvents="none" />

        <Animated.View entering={FadeInDown.duration(420).springify().damping(18)} style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.copy}>
              <Text style={styles.brandMark}>LastBag</Text>
              <Text style={styles.greeting} numberOfLines={1}>
                {greeting}, <Text style={styles.greetingName}>{firstName}</Text>
              </Text>
              <Text style={styles.subline} numberOfLines={1}>
                {subline}
              </Text>
            </View>

            <View style={styles.actions}>
              <MessageIconBadge
                variant="dark"
                compact
                size={17}
                onPress={() => router.push('/messages')}
              />
              <NotificationBellBadge
                variant="dark"
                compact
                size={17}
                onPress={() => router.push('/notifications')}
              />
              <Pressable
                onPress={() => router.push('/(tabs)/customer/profile')}
                accessibilityLabel="Profile"
                style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8F0EC']}
                  style={styles.avatarFill}>
                  <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Soft fade into canvas */}
      <LinearGradient
        colors={['rgba(245,243,239,0)', Palette.background]}
        style={styles.fade}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    marginBottom: -Spacing.md,
  },
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 4,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,180,120,0.18)',
    top: -90,
    right: -40,
  },
  glowSide: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -50,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
    backgroundColor: 'transparent',
    // Soft vignette via overlapping transparent layers isn't possible without image;
    // keep a light edge wash instead.
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  content: {
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    paddingTop: 2,
    gap: 4,
    minWidth: 0,
  },
  brandMark: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 2,
  },
  greeting: {
    ...Type.h1,
    fontSize: 22,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
    letterSpacing: -0.4,
  },
  greetingName: {
    color: Palette.white,
    fontWeight: '800',
  },
  subline: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.62)',
    fontWeight: '500',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  avatarFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.primaryDark,
    letterSpacing: 0.2,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});
