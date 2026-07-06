import { Image, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/Colors';

const logoMark = require('@/assets/images/logo-mark.png');
const logoMarkLight = require('@/assets/images/logo-mark-light.png');

const SIZES = {
  lg: { icon: 48, font: 32 },
  sm: { icon: 32, font: 22 },
} as const;

type LastBagLogoProps = {
  /** lg = welcome/auth hero, sm = headers/nav */
  size?: keyof typeof SIZES;
  /** dark = white mark on transparent (for terracotta/dark heroes) */
  variant?: 'light' | 'dark';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

export function LastBagLogo({
  size = 'lg',
  variant = 'light',
  style,
  imageStyle,
}: LastBagLogoProps) {
  const dimensions = SIZES[size];
  const source = variant === 'dark' ? logoMarkLight : logoMark;
  const textColor = variant === 'dark' ? Palette.white : Palette.primaryDark;

  return (
    <View style={[styles.container, style]} accessibilityLabel="LastBag">
      <Image
        source={source}
        style={[
          {
            width: dimensions.icon,
            height: dimensions.icon,
            borderRadius: variant === 'light' ? dimensions.icon * 0.22 : 0,
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
      <Text style={[styles.wordmark, { fontSize: dimensions.font, color: textColor }]}>LastBag</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
