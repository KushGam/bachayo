export const MAX_RESERVE_DISTANCE_KM = 10;

export function calculateDistance(
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

export function formatDistance(km: number): string {
  if (km < 0.1) return 'Nearby 📍';
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  if (km < 10) return `${km.toFixed(1)}km away`;
  return `${Math.round(km)}km · Out of range`;
}

export function getDistanceColor(km: number): string {
  if (km < 1) return '#059669';
  if (km < 5) return '#6B7280';
  if (km < 10) return '#D97706';
  return '#DC2626';
}

export function isTooFarToReserve(distanceKm: number | null | undefined): boolean {
  return distanceKm != null && distanceKm > MAX_RESERVE_DISTANCE_KM;
}
