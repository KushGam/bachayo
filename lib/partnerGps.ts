import * as Location from 'expo-location';

import { findNearestLocation } from '@/lib/locations';

export type PartnerGpsResult =
  | {
      ok: true;
      latitude: number;
      longitude: number;
      address: string;
      cityId: string;
      areaId: string;
    }
  | {
      ok: false;
      reason: 'permission' | 'error';
      message?: string;
    };

export function formatPartnerReadableAddress(
  place: Location.LocationGeocodedAddress | null | undefined,
): string {
  if (!place) return '';
  return [place.street, place.district, place.subregion, place.city, place.region]
    .filter(Boolean)
    .join(', ');
}

/** High-accuracy GPS capture for partner restaurant location. */
export async function capturePartnerLocation(): Promise<PartnerGpsResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, reason: 'permission' };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;

    let address = '';
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      address = formatPartnerReadableAddress(places?.[0]);
    } catch {
      // Address is optional — coordinates are the critical part
    }

    const nearest = findNearestLocation(latitude, longitude);

    return {
      ok: true,
      latitude,
      longitude,
      address,
      cityId: nearest.cityId,
      areaId: nearest.areaId,
    };
  } catch (err) {
    console.error('[partnerGps] capture failed', err);
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Could not get location',
    };
  }
}

export function hasPartnerGpsCoords(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude)
  );
}
