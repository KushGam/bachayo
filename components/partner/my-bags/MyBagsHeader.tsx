import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

export type MyBagsTabKey = 'today' | 'upcoming' | 'past';

const TAB_LABELS: Record<MyBagsTabKey, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  past: 'Past',
};

type MyBagsHeaderProps = {
  tab: MyBagsTabKey;
  paddingTop: number;
  todayCount: number;
  upcomingCount: number;
  pastCount: number;
  onTabChange: (tab: MyBagsTabKey) => void;
  onAddBag: () => void;
};

export function MyBagsHeader({
  tab,
  paddingTop,
  todayCount,
  upcomingCount,
  pastCount,
  onTabChange,
  onAddBag,
}: MyBagsHeaderProps) {
  const counts: Record<MyBagsTabKey, number> = {
    today: todayCount,
    upcoming: upcomingCount,
    past: pastCount,
  };

  const subtitle =
    tab === 'today'
      ? todayCount > 0
        ? `${todayCount} listing${todayCount === 1 ? '' : 's'} live today`
        : 'List surplus · customers reserve nearby'
      : tab === 'upcoming'
        ? upcomingCount > 0
          ? `${upcomingCount} scheduled ahead`
          : 'Schedule bags for coming days'
        : pastCount > 0
          ? 'Last 30 days of listings'
          : 'History after your first listings';

  return (
    <LinearGradient
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.title}>My Bags</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onAddBag();
          }}
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          hitSlop={8}>
          <Plus size={20} color={Palette.white} strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        {(['today', 'upcoming', 'past'] as MyBagsTabKey[]).map((key) => {
          const active = tab === key;
          const count = counts[key];
          const countLabel = count > 0 ? ` · ${count}` : '';
          return (
            <Pressable
              key={key}
              onPress={() => {
                void hapticButtonPress();
                onTabChange(key);
              }}
              style={styles.tabSlot}>
              {active ? (
                <Animated.View layout={Layout.duration(200)} style={styles.tabActive}>
                  <Text style={styles.tabTextActive}>
                    {TAB_LABELS[key]}
                    {countLabel}
                  </Text>
                </Animated.View>
              ) : (
                <View style={styles.tabInactive}>
                  <Text style={styles.tabTextInactive}>
                    {TAB_LABELS[key]}
                    {countLabel}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50,
    right: -36,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  tabBar: {
    backgroundColor: 'rgba(0,0,0,0.14)',
    borderRadius: Radius.pill,
    padding: 3,
    flexDirection: 'row',
  },
  tabSlot: { flex: 1 },
  tabActive: {
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.white,
  },
  tabInactive: {
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTextActive: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
  tabTextInactive: {
    ...Type.caption,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
  },
});
