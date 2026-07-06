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
  onTabChange: (tab: MyBagsTabKey) => void;
  onAddBag: () => void;
};

export function MyBagsHeader({ tab, paddingTop, onTabChange, onAddBag }: MyBagsHeaderProps) {
  return (
    <LinearGradient
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>Manage listings</Text>
          <Text style={styles.title}>My Bags</Text>
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
                  <Text style={styles.tabTextActive}>{TAB_LABELS[key]}</Text>
                </Animated.View>
              ) : (
                <View style={styles.tabInactive}>
                  <Text style={styles.tabTextInactive}>{TAB_LABELS[key]}</Text>
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
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.lg + 8,
    borderBottomRightRadius: Radius.lg + 8,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -40,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  eyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.5,
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
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: Radius.pill,
    padding: 3,
    flexDirection: 'row',
  },
  tabSlot: { flex: 1 },
  tabActive: {
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.white,
  },
  tabInactive: {
    height: 36,
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
