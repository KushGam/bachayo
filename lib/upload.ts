import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

function isLocalImageUri(uri: string): boolean {
  return (
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('ph:') ||
    uri.startsWith('assets-library:') ||
    uri.startsWith('blob:')
  );
}

function imageMetaFromUri(uri: string, mimeType?: string | null) {
  if (mimeType?.startsWith('image/')) {
    const ext = mimeType.includes('png')
      ? 'png'
      : mimeType.includes('webp')
        ? 'webp'
        : 'jpg';
    return { ext, contentType: mimeType };
  }

  const lower = uri.toLowerCase();
  const ext = lower.includes('.png') ? 'png' : lower.includes('.webp') ? 'webp' : 'jpg';
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return { ext, contentType };
}

function formatStorageError(message: string) {
  if (/row-level security|violates.*policy/i.test(message)) {
    return 'Storage permission denied. Apply Supabase storage migrations (016–019) for your project.';
  }
  if (/bucket not found/i.test(message)) {
    return 'Storage bucket not configured. Create rescue-bags / partner-covers buckets in Supabase.';
  }
  return message;
}

async function readImageBytes(uri: string, mimeType?: string | null): Promise<Uint8Array> {
  if (isLocalImageUri(uri)) {
    const file = new File(uri);
    if (!file.exists) {
      throw new Error('Image file not found on device. Try picking the photo again.');
    }

    const bytes = await file.bytes();
    if (!bytes.byteLength) {
      throw new Error('Image file is empty. Try picking the photo again.');
    }
    return bytes;
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Could not read image (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function uploadImage(
  bucket: string,
  folder: string,
  uri: string,
  mimeType?: string | null,
) {
  const bytes = await readImageBytes(uri, mimeType);
  const { ext, contentType } = imageMetaFromUri(uri, mimeType);
  const path = `${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.error(`[upload] ${bucket} upload failed`, { path, message: error.message });
    throw new Error(formatStorageError(error.message));
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPartnerCover(
  userId: string,
  uri: string,
  mimeType?: string | null,
) {
  return uploadImage('partner-covers', userId, uri, mimeType);
}

export async function uploadBagImage(
  partnerId: string,
  uri: string,
  mimeType?: string | null,
) {
  return uploadImage('rescue-bags', partnerId, uri, mimeType);
}

export async function uploadReviewPhoto(
  customerId: string,
  uri: string,
  mimeType?: string | null,
) {
  return uploadImage('review-photos', customerId, uri, mimeType);
}

export async function uploadAvatar(userId: string, uri: string, mimeType?: string | null) {
  const bytes = await readImageBytes(uri, mimeType);
  const { contentType } = imageMetaFromUri(uri, mimeType ?? 'image/jpeg');
  const path = `${userId}/avatar.jpg`;

  const { error } = await supabase.storage.from('avatars').upload(path, bytes, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.error('[upload] avatars upload failed', { path, message: error.message });
    throw new Error(formatStorageError(error.message));
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
