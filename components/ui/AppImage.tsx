import { Image, type ImageContentFit, type ImageLoadEventData, type ImageProps } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/Colors';

type ResizeMode = 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';

type AppImageProps = {
  source: ImageProps['source'];
  style?: StyleProp<ImageStyle | ViewStyle>;
  aspectRatio?: number;
  /** @deprecated Prefer contentFit — mapped for existing call sites */
  resizeMode?: ResizeMode;
  contentFit?: ImageContentFit;
  recyclingKey?: string;
  priority?: ImageProps['priority'];
  transition?: number;
  onLoad?: (event: ImageLoadEventData) => void;
  onError?: (event: { error: string }) => void;
};

function getSourceUri(source: ImageProps['source']): string | undefined {
  if (!source) return undefined;
  if (typeof source === 'number') return undefined;
  if (typeof source === 'string') return source;
  if (Array.isArray(source)) return getSourceUri(source[0]);
  if (typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return source.uri;
  }
  return undefined;
}

/** If a Supabase image-transform URL fails (plan/feature off), fall back to the raw object URL. */
function recoverStorageUrl(uri: string): string | null {
  const match = uri.match(
    /^(https?:\/\/[^/]+)\/storage\/v1\/render\/image\/public\/([^?]+)(?:\?.*)?$/,
  );
  if (!match) return null;
  return `${match[1]}/storage/v1/object/public/${match[2]}`;
}

function mapResizeMode(mode: ResizeMode | undefined): ImageContentFit {
  switch (mode) {
    case 'contain':
      return 'contain';
    case 'stretch':
      return 'fill';
    case 'center':
      return 'none';
    case 'cover':
    default:
      return 'cover';
  }
}

export function AppImage({
  source,
  style,
  aspectRatio,
  resizeMode = 'cover',
  contentFit,
  recyclingKey,
  priority = 'normal',
  transition = 180,
  onLoad,
  onError,
}: AppImageProps) {
  const originalUri = useMemo(() => getSourceUri(source), [source]);
  const [fallbackUri, setFallbackUri] = useState<string | null>(null);

  useEffect(() => {
    setFallbackUri(null);
  }, [originalUri]);

  const resolvedSource = useMemo(() => {
    if (fallbackUri) return { uri: fallbackUri };
    return source;
  }, [fallbackUri, source]);

  const fit = contentFit ?? mapResizeMode(resizeMode);
  const key = recyclingKey ?? fallbackUri ?? originalUri;

  return (
    <Image
      source={resolvedSource}
      style={[styles.base, aspectRatio ? { aspectRatio } : null, style as StyleProp<ImageStyle>]}
      contentFit={fit}
      cachePolicy="memory-disk"
      recyclingKey={key}
      priority={priority}
      transition={transition}
      onLoad={onLoad}
      onError={(event) => {
        if (!fallbackUri && originalUri) {
          const recovered = recoverStorageUrl(originalUri);
          if (recovered && recovered !== originalUri) {
            setFallbackUri(recovered);
            return;
          }
        }
        onError?.(event);
      }}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.imagePlaceholder,
    overflow: 'hidden',
  },
});
