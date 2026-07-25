export type PartnerMeta = {
  neighborhood?: string;
  opening_start?: string;
  opening_end?: string;
  bio?: string;
  accepted_payments?: string[];
  /** Optional Google/Apple Maps share link for precise pin */
  map_url?: string;
};

export function encodePartnerMeta(meta: PartnerMeta): string {
  return JSON.stringify(meta);
}

export function decodePartnerMeta(description: string | null | undefined): PartnerMeta {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description) as PartnerMeta;
    if (typeof parsed === 'object' && parsed && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return { bio: description };
  }
  return {};
}

export function mergePartnerMeta(
  current: string | null | undefined,
  patch: Partial<PartnerMeta>,
): string {
  return encodePartnerMeta({ ...decodePartnerMeta(current), ...patch });
}

export function getPartnerBio(description: string | null | undefined): string {
  return decodePartnerMeta(description).bio ?? '';
}
