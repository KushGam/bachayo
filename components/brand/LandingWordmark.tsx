import { StyleSheet, View } from 'react-native';

import { LastBagLogo } from '@/components/LastBagLogo';

type LandingWordmarkProps = {
  height?: number;
};

/** Compact wordmark for hero overlay — uses official LastBag logo. */
export function LandingWordmark({ height = 28 }: LandingWordmarkProps) {
  const size = height >= 36 ? 'md' : 'sm';

  return (
    <View style={styles.row}>
      <LastBagLogo size={size} variant="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
});
