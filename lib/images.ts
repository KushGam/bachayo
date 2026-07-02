import { uploadBagImage, uploadPartnerCover } from '@/lib/upload';

export const RESCUE_BAG_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=60';

type RescueBagImageSource = {
  image_url?: string | null;
  partner?: { cover_image_url?: string | null } | null;
};

export function getRescueBagImageUrl(
  bag: RescueBagImageSource,
  fallback = RESCUE_BAG_FALLBACK_IMAGE,
): string {
  const bagUrl = bag.image_url;
  if (bagUrl && !isLocalImageUri(bagUrl) && /^https?:\/\//.test(bagUrl)) {
    return bagUrl;
  }

  const coverUrl = bag.partner?.cover_image_url;
  if (coverUrl && !isLocalImageUri(coverUrl) && /^https?:\/\//.test(coverUrl)) {
    return coverUrl;
  }

  return fallback;
}

export function getProfileAvatarUrl(url: string | null | undefined): string | null {
  if (!url || isLocalImageUri(url)) return null;
  if (!/^https?:\/\//.test(url)) return null;
  return url;
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
