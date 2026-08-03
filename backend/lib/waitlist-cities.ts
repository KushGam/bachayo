export const WAITLIST_CITIES = [
  'Kathmandu',
  'Lalitpur',
  'Pokhara',
  'Bhaktapur',
  'Other',
] as const;

export const WAITLIST_PRIMARY_CITIES = [
  'Kathmandu',
  'Lalitpur',
  'Pokhara',
  'Bhaktapur',
] as const;

export type WaitlistCity = (typeof WAITLIST_CITIES)[number];

export function normalizeWaitlistCity(value: unknown): WaitlistCity | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = WAITLIST_CITIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return match ?? null;
}

/**
 * Resolves the city to store on waitlist.
 * When the user picks "Other", we save their typed city so demand is visible.
 */
export function resolveWaitlistCityInput(
  city: unknown,
  cityOther?: unknown,
): string | null {
  const selected = typeof city === 'string' ? city.trim() : '';
  if (!selected) return null;

  const known = normalizeWaitlistCity(selected);
  if (known && known !== 'Other') return known;

  const other =
    typeof cityOther === 'string' ? cityOther.trim().replace(/\s+/g, ' ').slice(0, 80) : '';

  if (other) {
    const asPrimary = WAITLIST_PRIMARY_CITIES.find(
      (c) => c.toLowerCase() === other.toLowerCase(),
    );
    if (asPrimary) return asPrimary;
    return other;
  }

  // "Other" without a name is not useful for demand tracking.
  if (known === 'Other') return null;

  // Free-form city string from older clients / geo fallback.
  return selected.slice(0, 80);
}

export function isOtherWaitlistCity(city: string | null | undefined): boolean {
  if (!city) return true;
  return !WAITLIST_PRIMARY_CITIES.some((c) => c.toLowerCase() === city.toLowerCase());
}

/** Map free-form geo city names onto our waitlist list when possible. */
export function mapGeoCityToWaitlist(geoCity: string | null | undefined): string | null {
  if (!geoCity?.trim()) return null;
  const normalized = normalizeWaitlistCity(geoCity);
  if (normalized && normalized !== 'Other') return normalized;

  const lower = geoCity.trim().toLowerCase();
  if (lower.includes('kathmandu') || lower.includes('kathmand')) return 'Kathmandu';
  if (lower.includes('lalitpur') || lower.includes('patan')) return 'Lalitpur';
  if (lower.includes('pokhara')) return 'Pokhara';
  if (lower.includes('bhaktapur')) return 'Bhaktapur';
  return geoCity.trim().slice(0, 80);
}
