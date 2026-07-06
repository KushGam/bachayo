import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type ReviewsHeaderProps = {
  paddingTop: number;
  reviewCount: number;
};

export function ReviewsHeader({ paddingTop, reviewCount }: ReviewsHeaderProps) {
  return (
    <LinearGradient
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Reputation</Text>
          <Text style={styles.title}>Reviews</Text>
          <Text style={styles.subtitle}>
            {reviewCount > 0
              ? `${reviewCount} customer review${reviewCount === 1 ? '' : 's'}`
              : 'Feedback from your pickups'}
          </Text>
        </View>
        <View style={styles.iconWrap}>
          <Star size={22} color={Palette.white} fill={Palette.white} strokeWidth={1.5} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.lg + 8,
    borderBottomRightRadius: Radius.lg + 8,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50,
    right: -30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
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
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
