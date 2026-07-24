import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
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
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.topRow}>
        <Pressable
          onPress={() => {
            void hapticButtonPress();
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}>
          <ChevronLeft size={20} color={Palette.white} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.title}>{isNp ? 'रेस्टुरेन्टहरू' : 'Restaurants'}</Text>
        <View style={styles.backSpacer} />
      </View>

      <Text style={styles.subtitle}>
        {isNp ? 'तपाईं नजिकका पार्टनरहरू' : 'Partners near you'}
      </Text>

      <Text style={styles.locationLabel}>{neighbourhoodLabel}</Text>
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
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 34,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...Type.h2,
    color: Palette.white,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
  subtitle: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '500',
    textAlign: 'center',
  },
  locationLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
});
