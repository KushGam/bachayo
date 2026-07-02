import { Image, StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';

const logoMark = require('@/assets/images/logo-mark.png');
const logoMarkLight = require('@/assets/images/logo-mark-light.png');

const SIZES = {
  lg: 64,
  sm: 40,
} as const;

type BachayoLogoProps = {
  /** lg = 64px (welcome/auth), sm = 40px (headers/nav) */
  size?: keyof typeof SIZES;
  /** dark = white mark on transparent (for terracotta/dark heroes) */
  variant?: 'light' | 'dark';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

export function BachayoLogo({
  size = 'lg',
  variant = 'light',
  style,
  imageStyle,
}: BachayoLogoProps) {
  const dimension = SIZES[size];
  const source = variant === 'dark' ? logoMarkLight : logoMark;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[
          {
            width: dimension,
            height: dimension,
            borderRadius: variant === 'light' ? dimension * 0.22 : 0,
          },
          imageStyle,
        ]}
        resizeMode="contain"
        accessibilityLabel="Bachayo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
