import { Image } from 'expo-image';

import { uploadBagImage, uploadPartnerCover } from '@/lib/upload';

export const RESCUE_BAG_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=60';

/** Display sizes — widths are @2x so thumbs stay sharp on retina. */
export type ImageSize = 'thumb' | 'card' | 'hero' | 'avatar';

const SIZE_WIDTH: Record<ImageSize, number> = {
  thumb: 160,
  card: 360,
  hero: 960,
  avatar: 160,
};

type RescueBagImageSource = {
  image_url?: string | null;
  partner?: { cover_image_url?: string | null } | null;
};

/**
 * Serve a smaller remote image when possible.
 * - Unsplash: rewrite w/q params
 * - Supabase Storage: use /render/image transforms (falls back in AppImage if disabled)
 */
export function getOptimizedImageUrl(url: string, size: ImageSize = 'card'): string {
  if (!url || isLocalImageUri(url) || !/^https?:\/\//.test(url)) return url;

  const width = SIZE_WIDTH[size];
  const quality = size === 'hero' ? 72 : 65;

  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(quality));
      return parsed.toString();
    } catch {
      return url;
    }
  }

  const supabaseMatch = url.match(
    /^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/([^?]+)(?:\?.*)?$/,
  );
  if (supabaseMatch) {
    const [, origin, path] = supabaseMatch;
    return `${origin}/storage/v1/render/image/public/${path}?width=${width}&resize=contain&quality=${quality}`;
  }

  // Already a transform URL — bump width if present, else leave alone
  if (url.includes('/storage/v1/render/image/public/')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('width', String(width));
      parsed.searchParams.set('quality', String(quality));
      if (!parsed.searchParams.has('resize')) {
        parsed.searchParams.set('resize', 'contain');
      }
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}

export function getRescueBagImageUrl(
  bag: RescueBagImageSource,
  size: ImageSize = 'card',
  fallback = RESCUE_BAG_FALLBACK_IMAGE,
): string {
  const bagUrl = bag.image_url;
  if (bagUrl && !isLocalImageUri(bagUrl) && /^https?:\/\//.test(bagUrl)) {
    return getOptimizedImageUrl(bagUrl, size);
  }

  const coverUrl = bag.partner?.cover_image_url;
  if (coverUrl && !isLocalImageUri(coverUrl) && /^https?:\/\//.test(coverUrl)) {
    return getOptimizedImageUrl(coverUrl, size);
  }

  return getOptimizedImageUrl(fallback, size);
}

export function getProfileAvatarUrl(
  url: string | null | undefined,
  size: ImageSize = 'avatar',
): string | null {
  if (!url || isLocalImageUri(url)) return null;
  if (!/^https?:\/\//.test(url)) return null;
  return getOptimizedImageUrl(url, size);
}

export function isLocalImageUri(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return (
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('ph:') ||
    uri.startsWith('assets-library:') ||
    uri.startsWith('blob:')
  );
}

/** Warm disk/memory cache for the next screens (home feed, closing soon). */
export function prefetchImages(urls: Array<string | null | undefined>) {
  const unique = [...new Set(urls.filter((u): u is string => Boolean(u)))];
  if (!unique.length) return;
  void Image.prefetch(unique, 'memory-disk');
}

export async function resolveBagImageUrl(
  partnerId: string,
  imageUri: string | null | undefined,
  mimeType?: string | null,
): Promise<string | null> {
  if (!imageUri) return null;
  if (isLocalImageUri(imageUri)) {
    return uploadBagImage(partnerId, imageUri, mimeType);
  }
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    return imageUri;
  }
  return null;
}

export async function resolvePartnerCoverUrl(
  userId: string,
  imageUri: string | null | undefined,
  mimeType?: string | null,
): Promise<string | null> {
  if (!imageUri) return null;
  if (isLocalImageUri(imageUri)) {
    return uploadPartnerCover(userId, imageUri, mimeType);
  }
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    return imageUri;
  }
  return null;
}
