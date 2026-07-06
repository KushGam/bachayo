import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Map, ShoppingBag, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type TabConfig = {
  name: string;
  label: string;
  icon: LucideIcon;
};

const TABS: TabConfig[] = [
  { name: 'home', label: 'Home', icon: Home },
  { name: 'explore', label: 'Explore', icon: Map },
  { name: 'my-bags', label: 'My Bags', icon: ShoppingBag },
  { name: 'profile', label: 'Profile', icon: User },
];

export function CustomerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12);

  return (
    <View style={[styles.shell, { paddingBottom: bottomPad }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = TABS.find((item) => item.name === route.name);
          if (!tab) return null;

          const focused = state.index === index;
          const Icon = tab.icon;

          const onPress = () => {
            void hapticButtonPress();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}>
              <View style={[styles.iconSlot, focused && styles.iconSlotActive]}>
                <Icon
                  size={focused ? 22 : 20}
                  color={focused ? Palette.primary : Palette.textTertiary}
                  strokeWidth={focused ? 2.4 : 2}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
              {focused ? <View style={styles.activeDot} /> : <View style={styles.dotSpacer} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Palette.background,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg + 4,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    ...FloatingShadow,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 52,
    paddingVertical: 2,
  },
  tabPressed: {
    opacity: 0.82,
  },
  iconSlot: {
    width: 40,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotActive: {
    backgroundColor: Palette.primaryLight,
  },
  label: {
    ...Type.label,
    fontSize: 10,
    fontWeight: '500',
    color: Palette.textTertiary,
  },
  labelActive: {
    color: Palette.primaryDark,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.primary,
    marginTop: 1,
  },
  dotSpacer: {
    width: 4,
    height: 4,
    marginTop: 1,
  },
});
