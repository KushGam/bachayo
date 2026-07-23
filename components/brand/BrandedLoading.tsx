import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { LastBagBagIcon } from '@/components/brand/LastBagBagIcon';
import { Palette } from '@/constants/Colors';

type BrandedLoadingProps = {
  showMarkImage?: boolean;
};

export function BrandedLoading({ showMarkImage = true }: BrandedLoadingProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
      style={styles.screen}>
      {showMarkImage ? <LastBagBagIcon size={120} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
  },
});
