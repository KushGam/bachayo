import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { getRescueBagImageUrl } from '@/lib/images';
import { formatNprPaisa } from '@/lib/helpers';
import type { HomeBag } from '@/store/useBagsStore';

type ClosingSoonCardProps = {
  bag: HomeBag;
  countdownLabel: string;
  onPress: () => void;
};

export function ClosingSoonCard({ bag, countdownLabel, onPress }: ClosingSoonCardProps) {
  const showCountdown =
    countdownLabel !== 'Closing now' &&
    (countdownLabel.includes('m left') || countdownLabel.includes('h '));

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        <AppImage
          source={{ uri: getRescueBagImageUrl(bag) }}
          style={styles.image}
          aspectRatio={4 / 3}
        />
        <LinearGradient
          colors={['transparent', 'rgba(28, 25, 23, 0.75)']}
          style={styles.imageGradient}
        />
        {showCountdown ? (
          <View style={styles.countdownPill}>
            <Text style={styles.countdown}>{countdownLabel}</Text>
          </View>
        ) : null}
        <View style={styles.imageFooter}>
          <Text style={styles.price}>{formatNprPaisa(bag.rescue_price)}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.partner}>
          {bag.partner.name}
        </Text>
        <Text numberOfLines={2} style={styles.bagTitle}>
          {bag.title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    backgroundColor: Palette.imagePlaceholder,
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  countdownPill: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(158, 74, 60, 0.92)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  countdown: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.white,
  },
  imageFooter: {
    position: 'absolute',
    left: Spacing.sm,
    right: Spacing.sm,
    bottom: Spacing.sm,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.2,
  },
  body: {
    padding: Spacing.md,
    gap: 3,
  },
  partner: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  bagTitle: {
    ...Type.label,
    color: Palette.textSecondary,
    lineHeight: 15,
  },
});
