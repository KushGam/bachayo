export const WAITLIST_CITIES = [
  'Kathmandu',
  'Lalitpur',
  'Pokhara',
  'Bhaktapur',
  'Other',
] as const;

export type WaitlistCity = (typeof WAITLIST_CITIES)[number];

export function normalizeWaitlistCity(value: unknown): WaitlistCity | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = WAITLIST_CITIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return match ?? null;
}

/** Map free-form geo city names onto our waitlist list when possible. */
export function mapGeoCityToWaitlist(geoCity: string | null | undefined): WaitlistCity | null {
  if (!geoCity?.trim()) return null;
  const normalized = normalizeWaitlistCity(geoCity);
  if (normalized) return normalized;

  const lower = geoCity.trim().toLowerCase();
  if (lower.includes('kathmandu') || lower.includes('kathmand')) return 'Kathmandu';
  if (lower.includes('lalitpur') || lower.includes('patan')) return 'Lalitpur';
  if (lower.includes('pokhara')) return 'Pokhara';
  if (lower.includes('bhaktapur')) return 'Bhaktapur';
  return 'Other';
}
