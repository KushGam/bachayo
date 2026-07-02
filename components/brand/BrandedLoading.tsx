import { Image, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';

const splashMark = require('@/assets/images/logo-mark-light.png');

type BrandedLoadingProps = {
  showMarkImage?: boolean;
};

export function BrandedLoading({ showMarkImage = true }: BrandedLoadingProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
      style={styles.screen}>
      {showMarkImage ? (
        <Image source={splashMark} style={styles.markImage} resizeMode="contain" />
      ) : null}
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
  markImage: {
    width: 120,
    height: 120,
  },
});
