import { useEffect, useMemo } from 'react';
import {
  type ImageProps,
  type ImageSourcePropType,
  type ImageStyle,
  StyleSheet,
  View,
  type StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';

type AppImageProps = Omit<ImageProps, 'style'> & {
  style?: StyleProp<ImageStyle>;
  aspectRatio?: number;
};

function getSourceUri(source: ImageSourcePropType | undefined) {
  if (!source) return undefined;
  if (typeof source === 'number') return undefined;
  if (Array.isArray(source)) {
    return getSourceUri(source[0]);
  }
  return source.uri;
}

export function AppImage({ style, aspectRatio, onLoad, onError, ...props }: AppImageProps) {
  const uri = useMemo(() => getSourceUri(props.source), [props.source]);
  const isRemote = Boolean(uri?.startsWith('http://') || uri?.startsWith('https://'));
  const opacity = useSharedValue(isRemote ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const reveal = () => {
    opacity.value = withTiming(1, { duration: 250 });
  };

  useEffect(() => {
    if (isRemote) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0;
  }, [isRemote, uri, opacity]);

  return (
    <View style={[styles.placeholder, aspectRatio ? { aspectRatio } : null, style]}>
      <Animated.Image
        style={[StyleSheet.absoluteFill, styles.image, animatedStyle]}
        onLoad={(e) => {
          reveal();
          onLoad?.(e);
        }}
        onLoadEnd={reveal}
        onError={(e) => {
          opacity.value = 1;
          onError?.(e);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Palette.imagePlaceholder,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
