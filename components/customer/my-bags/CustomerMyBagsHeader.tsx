import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

export type CustomerMyBagsTab = 'active' | 'past';

type CustomerMyBagsHeaderProps = {
  tab: CustomerMyBagsTab;
  paddingTop: number;
  activeCount: number;
  onTabChange: (tab: CustomerMyBagsTab) => void;
};

export function CustomerMyBagsHeader({
  tab,
  paddingTop,
  activeCount,
  onTabChange,
}: CustomerMyBagsHeaderProps) {
  return (
    <LinearGradient
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Your reservations</Text>
          <Text style={styles.title}>My Bags</Text>
          <Text style={styles.subtitle}>
            {activeCount > 0
              ? `${activeCount} active pickup${activeCount === 1 ? '' : 's'}`
              : 'QR codes and pickup details'}
          </Text>
        </View>
        <View style={styles.iconWrap}>
          <ShoppingBag size={22} color={Palette.white} strokeWidth={2} />
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['active', 'past'] as CustomerMyBagsTab[]).map((key) => {
          const active = tab === key;
          const label = key === 'active' ? 'Active' : 'Past';
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
                  <Text style={styles.tabTextActive}>{label}</Text>
                </Animated.View>
              ) : (
                <View style={styles.tabInactive}>
                  <Text style={styles.tabTextInactive}>{label}</Text>
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
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
    marginTop: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: Radius.pill,
    padding: 3,
    flexDirection: 'row',
  },
  tabSlot: {
    flex: 1,
  },
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
