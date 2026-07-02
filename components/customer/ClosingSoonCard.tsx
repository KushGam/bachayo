import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
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
      <AppImage
        source={{ uri: getRescueBagImageUrl(bag) }}
        style={styles.image}
        aspectRatio={16 / 9}
      />
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.partner}>
          {bag.partner.name}
        </Text>
        <Text numberOfLines={1} style={styles.bagTitle}>
          {bag.title}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatNprPaisa(bag.rescue_price)}</Text>
          {showCountdown ? (
            <View style={styles.countdownPill}>
              <Text style={styles.countdown}>{countdownLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: '#F0EDE8',
  },
  pressed: {
    opacity: 0.94,
  },
  image: {
    width: '100%',
    backgroundColor: '#FAECE7',
  },
  body: {
    padding: 12,
    gap: 4,
  },
  partner: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  bagTitle: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primary,
  },
  countdownPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countdown: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
  },
});
