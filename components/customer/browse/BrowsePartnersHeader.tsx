import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type BrowsePartnersHeaderProps = {
  paddingTop: number;
  locale: 'en' | 'np';
  neighbourhoodLabel: string;
};

export function BrowsePartnersHeader({
  paddingTop,
  locale,
  neighbourhoodLabel,
}: BrowsePartnersHeaderProps) {
  const router = useRouter();
  const isNp = locale === 'np';

  return (
    <LinearGradient
      colors={[Palette.primaryDarker, Palette.primaryDark, '#C24F28']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glowA} pointerEvents="none" />
      <View style={styles.glowB} pointerEvents="none" />

      <View style={styles.topRow}>
        <Pressable
          onPress={() => {
            void hapticButtonPress();
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityLabel={isNp ? 'पछाडि' : 'Back'}>
          <ChevronLeft size={20} color={Palette.white} strokeWidth={2.5} />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{isNp ? 'रेस्टुरेन्टहरू' : 'Restaurants'}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color="rgba(255,255,255,0.75)" strokeWidth={2.4} />
            <Text style={styles.locationLabel} numberOfLines={1}>
              {neighbourhoodLabel}
            </Text>
          </View>
        </View>

        <View style={styles.backSpacer} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -90,
    right: -50,
  },
  glowB: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.08)',
    bottom: -40,
    left: -30,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 38,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  locationLabel: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '500',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
