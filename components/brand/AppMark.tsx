import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

const logoMark = require('@/assets/images/logo-mark.png');
const logoMarkLight = require('@/assets/images/logo-mark-light.png');

type AppMarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AppMarkSize, number> = {
  xs: 40,
  sm: 56,
  md: 72,
  lg: 96,
  xl: 120,
};

type AppMarkProps = {
  size?: AppMarkSize;
  /** When true, use white mark only (no terracotta tile) */
  onDark?: boolean;
  style?: ViewStyle;
};

export function AppMark({ size = 'lg', onDark = false, style }: AppMarkProps) {
  const dimension = SIZES[size];
  const source = onDark ? logoMarkLight : logoMark;

  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={source}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: onDark ? 0 : dimension * 0.22,
        }}
        resizeMode="contain"
        accessibilityLabel="Bachayo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
