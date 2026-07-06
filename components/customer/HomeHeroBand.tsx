import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeSearchBar } from '@/components/customer/HomeSearchBar';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { NotificationBellBadge } from '@/components/ui/NotificationBellBadge';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';
import { formatTodayBilingual, getGreeting, getInitials } from '@/lib/helpers';

type HomeHeroBandProps = {
  userName: string;
  locale: 'en' | 'np';
  cityId: string;
  areaId: string;
  onLocationChange: (cityId: string, areaId: string) => void;
  searchPlaceholder: string;
  mapLabel: string;
  searchQuery: string;
  isSearching: boolean;
  cancelLabel: string;
  onSearchChange: (text: string) => void;
  onSearchFocus: () => void;
  onSearchCancel: () => void;
  onMapPress: () => void;
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

export function HomeHeroBand({
  userName,
  locale,
  cityId,
  areaId,
  onLocationChange,
  searchPlaceholder,
  mapLabel,
  searchQuery,
  isSearching,
  cancelLabel,
  onSearchChange,
  onSearchFocus,
  onSearchCancel,
  onMapPress,
}: HomeHeroBandProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = userName.split(/\s+/)[0] || userName;
  const today = formatTodayBilingual();
  const dateLabel = locale === 'np' ? today.np : today.en;

  return (
    <LinearGradient
      colors={[Palette.primaryDark, Palette.primary, Palette.primaryMid]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + Spacing.md }]}>
      <StatusBar style="light" />

      <View style={styles.topRow}>
        <Text style={styles.brand}>LastBag</Text>
        <View style={styles.actions}>
          <NotificationBellBadge onPress={() => router.push('/notifications')} />
          <Pressable
            onPress={() => router.push('/(tabs)/customer/my-bags')}
            style={({ pressed }) => [styles.glassBtn, pressed && styles.pressed]}>
            <AppSymbol ios="bag" android="shopping-bag" size={20} color={Palette.white} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/customer/profile')}
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}>
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.greetingBlock}>
        <Text style={styles.eyebrow}>{dateLabel}</Text>
        <Text style={styles.greeting}>
          {getGreetingLabel(locale)}, {firstName}
        </Text>
      </View>

      <View style={styles.locationWrap}>
        <LocationPicker
          variant="pill"
          tone="dark"
          value={areaId}
          onChange={onLocationChange}
        />
      </View>

      <HomeSearchBar
        placeholder={searchPlaceholder}
        mapLabel={mapLabel}
        value={searchQuery}
        isSearching={isSearching}
        cancelLabel={cancelLabel}
        onChangeText={onSearchChange}
        onFocus={onSearchFocus}
        onCancel={onSearchCancel}
        onMapPress={onMapPress}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    gap: Spacing.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  glassBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  pressed: {
    opacity: 0.82,
  },
  greetingBlock: {
    gap: 2,
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 2,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.white,
    lineHeight: 28 * 1.1,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  locationWrap: {
    alignSelf: 'flex-start',
  },
});
