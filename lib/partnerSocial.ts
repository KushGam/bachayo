import { openExternalUrl } from '@/lib/helpers';

export type PartnerSocialFields = {
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
};

export type PartnerSocialKind = 'website' | 'facebook' | 'instagram' | 'whatsapp';

export const PARTNER_SOCIAL_META: Record<
  PartnerSocialKind,
  { label: string; color: string; emoji: string }
> = {
  website: { label: 'Website', color: '#1A1A1A', emoji: '🌐' },
  facebook: { label: 'Facebook', color: '#1877F2', emoji: '📘' },
  instagram: { label: 'Instagram', color: '#E4405F', emoji: '📸' },
  whatsapp: { label: 'WhatsApp', color: '#25D366', emoji: '💬' },
};

export function normalizeWebsite(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

export function normalizeFacebook(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  return trimmed
    .replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '');
}

export function normalizeInstagram(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  const handle = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/$/, '')
    .replace(/^@/, '');
  return handle ? `@${handle}` : null;
}

export function normalizeWhatsapp(value: string | null | undefined): string | null {
  const digits = (value ?? '').replace(/\D/g, '').replace(/^977/, '').replace(/^0/, '');
  if (!digits) return null;
  return digits;
}

export function hasAnyPartnerSocial(partner: PartnerSocialFields | null | undefined) {
  if (!partner) return false;
  return Boolean(
    partner.website?.trim() ||
      partner.facebook?.trim() ||
      partner.instagram?.trim() ||
      partner.whatsapp?.trim(),
  );
}

export function socialDisplayValue(kind: PartnerSocialKind, raw: string) {
  if (kind === 'website') return raw.replace(/^https?:\/\//i, '');
  if (kind === 'facebook') return raw.includes('facebook.com') ? raw : `facebook.com/${raw}`;
  if (kind === 'instagram') return raw.startsWith('@') ? raw : `@${raw}`;
  if (kind === 'whatsapp') return raw.startsWith('+') ? raw : `+977 ${raw}`;
  return raw;
}

/** Primary URL for a social link (https preferred for reliable opening). */
export function socialOpenUrl(kind: PartnerSocialKind, raw: string): string | null {
  const candidates = socialOpenUrlCandidates(kind, raw);
  return candidates[0] ?? null;
}

export function socialOpenUrlCandidates(kind: PartnerSocialKind, raw: string): string[] {
  const value = raw.trim();
  if (!value) return [];

  if (kind === 'website') {
    const url = normalizeWebsite(value);
    return url ? [url] : [];
  }
  if (kind === 'facebook') {
    const handle = normalizeFacebook(value);
    return handle ? [`https://facebook.com/${handle}`] : [];
  }
  if (kind === 'instagram') {
    const handle = (normalizeInstagram(value) ?? '').replace(/^@/, '');
    return handle ? [`https://instagram.com/${handle}`] : [];
  }
  const phone = normalizeWhatsapp(value);
  if (!phone) return [];
  // App scheme first when available; https fallback works in Expo Go / Simulator.
  return [`whatsapp://send?phone=977${phone}`, `https://wa.me/977${phone}`];
}

export async function openPartnerSocial(kind: PartnerSocialKind, raw: string) {
  const urls = socialOpenUrlCandidates(kind, raw);
  if (urls.length === 0) return;
  await openExternalUrl(urls, 'Could not open this link. Please try again.');
}

export function listPartnerSocials(partner: PartnerSocialFields) {
  const items: { kind: PartnerSocialKind; value: string }[] = [];
  if (partner.website?.trim()) items.push({ kind: 'website', value: partner.website.trim() });
  if (partner.facebook?.trim()) items.push({ kind: 'facebook', value: partner.facebook.trim() });
  if (partner.instagram?.trim()) items.push({ kind: 'instagram', value: partner.instagram.trim() });
  if (partner.whatsapp?.trim()) items.push({ kind: 'whatsapp', value: partner.whatsapp.trim() });
  return items;
}
