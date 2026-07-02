import { CITIES, type Area, type City } from '@/constants/locations';
import { haversineDistanceKm } from '@/lib/helpers';

export type LocationSelection = {
  cityId: string;
  areaId: string;
  city: City;
  area: Area;
};

export function getCityById(cityId: string): City | undefined {
  return CITIES.find((city) => city.id === cityId);
}

export function getAreaById(areaId: string): Area | undefined {
  for (const city of CITIES) {
    const area = city.areas.find((item) => item.id === areaId);
    if (area) return area;
  }
  return undefined;
}

export function resolveLocation(areaId: string | null | undefined): LocationSelection | null {
  if (!areaId) return null;
  for (const city of CITIES) {
    const area = city.areas.find((item) => item.id === areaId);
    if (area) {
      return { cityId: city.id, areaId: area.id, city, area };
    }
  }
  return null;
}

export function formatLocationLabel(
  cityId: string,
  areaId: string,
  locale: 'en' | 'np' = 'en',
): string {
  const city = getCityById(cityId);
  const area = getAreaById(areaId);
  if (!city || !area) return 'Choose location';

  const areaName = locale === 'np' ? area.nameNp : area.name;
  const cityName = locale === 'np' ? city.nameNp : city.name;
  return `${areaName}, ${cityName}`;
}

export type LocationSearchResult = LocationSelection;

export function searchLocations(query: string): LocationSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const results: LocationSearchResult[] = [];
  for (const city of CITIES) {
    const cityMatches =
      city.name.toLowerCase().includes(normalized) ||
      city.nameNp.includes(normalized) ||
      city.id.includes(normalized);

    for (const area of city.areas) {
      const areaMatches =
        area.name.toLowerCase().includes(normalized) ||
        area.nameNp.includes(normalized) ||
        area.id.includes(normalized);

      if (cityMatches || areaMatches) {
        results.push({ cityId: city.id, areaId: area.id, city, area });
      }
    }
  }
  return results;
}

export function findNearestLocation(latitude: number, longitude: number): LocationSelection {
  let nearest: LocationSelection | null = null;
  let minDistance = Infinity;

  for (const city of CITIES) {
    for (const area of city.areas) {
      const distance = haversineDistanceKm(
        { latitude, longitude },
        { latitude: area.latitude, longitude: area.longitude },
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { cityId: city.id, areaId: area.id, city, area };
      }
    }
  }

  return (
    nearest ?? {
      cityId: CITIES[0].id,
      areaId: CITIES[0].areas[0].id,
      city: CITIES[0],
      area: CITIES[0].areas[0],
    }
  );
}

/** Map pin validation bounds — ~0.35° around selected city center */
export function getCityMapBounds(cityId: string) {
  const city = getCityById(cityId) ?? CITIES[0];
  const pad = 0.35;
  return {
    latMin: city.latitude - pad,
    latMax: city.latitude + pad,
    lngMin: city.longitude - pad,
    lngMax: city.longitude + pad,
  };
}

export function isWithinCityBounds(
  cityId: string,
  latitude: number,
  longitude: number,
): boolean {
  const bounds = getCityMapBounds(cityId);
  return (
    latitude >= bounds.latMin &&
    latitude <= bounds.latMax &&
    longitude >= bounds.lngMin &&
    longitude <= bounds.lngMax
  );
}

export function getCityMapRegion(cityId: string) {
  const city = getCityById(cityId) ?? CITIES[0];
  return {
    latitude: city.latitude,
    longitude: city.longitude,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  };
}
