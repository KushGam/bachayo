import { StyleSheet, Text, View } from 'react-native';

import { LastBagLeafIcon } from '@/components/brand/LastBagLeafIcon';
import { Palette } from '@/constants/Colors';

type LandingWordmarkProps = {
  height?: number;
};

/** Compact white wordmark for hero overlay — 28px tall by default. */
export function LandingWordmark({ height = 28 }: LandingWordmarkProps) {
  const iconSize = Math.round(height * 0.86);
  const fontSize = Math.round(height * 0.64);

  return (
    <View style={styles.row}>
      <LastBagLeafIcon size={iconSize} color={Palette.white} />
      <Text style={[styles.wordmark, { fontSize, lineHeight: height }]}>LastBag</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  wordmark: {
    color: Palette.white,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
