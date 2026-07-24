export interface LaunchCity {
  name: string;
  nameNp: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export const LAUNCH_CITIES: LaunchCity[] = [
  {
    name: 'Kathmandu',
    nameNp: 'काठमाडौं',
    latitude: 27.7172,
    longitude: 85.324,
    radiusKm: 15,
  },
  {
    name: 'Lalitpur',
    nameNp: 'ललितपुर',
    latitude: 27.6644,
    longitude: 85.3188,
    radiusKm: 10,
  },
  {
    name: 'Pokhara',
    nameNp: 'पोखरा',
    latitude: 28.2096,
    longitude: 83.9856,
    radiusKm: 15,
  },
  {
    name: 'Bhaktapur',
    nameNp: 'भक्तपुर',
    latitude: 27.671,
    longitude: 85.4298,
    radiusKm: 8,
  },
];

export const LAUNCH_CITY_IDS = [
  'kathmandu',
  'lalitpur',
  'pokhara',
  'bhaktapur',
] as const;

export function isLaunchCityId(cityId: string | null | undefined): boolean {
  if (!cityId) return false;
  return (LAUNCH_CITY_IDS as readonly string[]).includes(cityId);
}

/** Check if coordinates are in a launch city */
export function getLaunchCity(
  latitude: number,
  longitude: number,
): LaunchCity | null {
  for (const city of LAUNCH_CITIES) {
    const distance = calculateDistance(
      latitude,
      longitude,
      city.latitude,
      city.longitude,
    );
    if (distance <= city.radiusKm) {
      return city;
    }
  }
  return null;
}

function calculateDistance(
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

export function isInLaunchCity(latitude: number, longitude: number): boolean {
  return getLaunchCity(latitude, longitude) !== null;
}
