import * as Location from 'expo-location';

import { findNearestLocation } from '@/lib/locations';
import { supabase } from '@/lib/supabase';

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

export type PartnerLocationPatch = {
  address?: string;
  city_id?: string;
  area_id?: string;
  latitude: number;
  longitude: number;
  location_verified: boolean;
  description?: string;
};

/**
 * Persists partner location. Retries without `location_verified` so the save still
 * succeeds on projects where migration 048 hasn't been applied yet.
 */
export async function savePartnerLocation(partnerId: string, patch: PartnerLocationPatch) {
  const { location_verified, ...rest } = patch;

  const { error } = await supabase
    .from('partners')
    .update({ ...rest, location_verified } as never)
    .eq('id', partnerId);

  if (!error) return { error: null, verifiedColumnMissing: false };

  const missingColumn = /location_verified/i.test(error.message);
  if (!missingColumn) return { error, verifiedColumnMissing: false };

  const { error: retryError } = await supabase
    .from('partners')
    .update(rest as never)
    .eq('id', partnerId);

  return { error: retryError, verifiedColumnMissing: true };
}

/**
 * True when the partner's location is usable for customer distance.
 * `location_verified` is null/undefined on projects where migration 048 hasn't run —
 * treat saved coordinates as sufficient there so partners aren't nagged forever.
 */
export function isPartnerLocationVerified(row: {
  latitude?: number | null;
  longitude?: number | null;
  location_verified?: boolean | null;
}): boolean {
  if (!hasPartnerGpsCoords(row.latitude, row.longitude)) return false;
  if (row.location_verified === undefined || row.location_verified === null) return true;
  return row.location_verified === true;
}
