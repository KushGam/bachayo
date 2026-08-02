/** Match the in-app reservation radius so "nearby" alerts stay actionable. */
export const NEW_BAG_NOTIFY_RADIUS_KM = 10;

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type LatLng = { latitude: number | null; longitude: number | null };

/**
 * Prefer live GPS (`last_*`), then home pin. Returns null when the customer
 * has no usable coordinates.
 */
export function customerCoords(profile: {
  last_latitude?: number | null;
  last_longitude?: number | null;
  home_latitude?: number | null;
  home_longitude?: number | null;
}): LatLng | null {
  if (
    profile.last_latitude != null &&
    profile.last_longitude != null &&
    Number.isFinite(profile.last_latitude) &&
    Number.isFinite(profile.last_longitude)
  ) {
    return { latitude: profile.last_latitude, longitude: profile.last_longitude };
  }
  if (
    profile.home_latitude != null &&
    profile.home_longitude != null &&
    Number.isFinite(profile.home_latitude) &&
    Number.isFinite(profile.home_longitude)
  ) {
    return { latitude: profile.home_latitude, longitude: profile.home_longitude };
  }
  return null;
}

/**
 * Nearby = within radius when both sides have coordinates; otherwise same
 * neighbourhood (area_id) as a safe fallback.
 */
export function isCustomerNearPartner(input: {
  partner: LatLng & { area_id: string | null };
  customer: LatLng & {
    area_id?: string | null;
    last_latitude?: number | null;
    last_longitude?: number | null;
    home_latitude?: number | null;
    home_longitude?: number | null;
  };
  radiusKm?: number;
}): boolean {
  const radius = input.radiusKm ?? NEW_BAG_NOTIFY_RADIUS_KM;
  const partnerLat = input.partner.latitude;
  const partnerLng = input.partner.longitude;
  const coords = customerCoords(input.customer);

  if (
    partnerLat != null &&
    partnerLng != null &&
    coords?.latitude != null &&
    coords?.longitude != null
  ) {
    return (
      haversineDistanceKm(partnerLat, partnerLng, coords.latitude, coords.longitude) <= radius
    );
  }

  if (!input.partner.area_id || !input.customer.area_id) return false;
  return input.partner.area_id === input.customer.area_id;
}
