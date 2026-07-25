import { findNearestLocation } from '@/lib/locations';

export type ParsedMapLink = {
  latitude: number;
  longitude: number;
  cityId: string;
  areaId: string;
};

const COORD_PAIR =
  /(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/;

function isPlausibleNepalCoords(lat: number, lng: number) {
  // Loose Nepal bounding box — still accepts nearby border areas
  return lat >= 26 && lat <= 31 && lng >= 80 && lng <= 89;
}

function fromPair(latRaw: string, lngRaw: string): { latitude: number; longitude: number } | null {
  const latitude = Number(latRaw);
  const longitude = Number(lngRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/**
 * Extract coordinates from a Google Maps / Apple Maps / geo: link,
 * or a pasted "lat, lng" pair.
 */
export function extractCoordsFromMapText(input: string): { latitude: number; longitude: number } | null {
  const text = input.trim();
  if (!text) return null;

  // Apple Maps: ?ll=27.7,85.3 or &coordinate=27.7,85.3
  const appleLl = text.match(/[?&](?:ll|coordinate)=(-?\d+\.?\d*),(-?\d+\.?\d*)/i);
  if (appleLl) {
    const coords = fromPair(appleLl[1], appleLl[2]);
    if (coords) return coords;
  }

  // Google Maps place / search: /@27.7172,85.3240,17z
  const atMatch = text.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,\d)/);
  if (atMatch) {
    const coords = fromPair(atMatch[1], atMatch[2]);
    if (coords) return coords;
  }

  // ?q=27.7172,85.3240 or ?query=...
  const qMatch = text.match(/[?&](?:q|query)=(-?\d+\.?\d*)[,+\s]+(-?\d+\.?\d*)/i);
  if (qMatch) {
    const coords = fromPair(qMatch[1], qMatch[2]);
    if (coords) return coords;
  }

  // !3d27.7172!4d85.3240 (Google data params)
  const d3 = text.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (d3) {
    const coords = fromPair(d3[1], d3[2]);
    if (coords) return coords;
  }

  // geo:27.7172,85.3240
  const geo = text.match(/geo:(-?\d+\.?\d*),(-?\d+\.?\d*)/i);
  if (geo) {
    const coords = fromPair(geo[1], geo[2]);
    if (coords) return coords;
  }

  // Plain "28.04000, 84.50000"
  const plain = text.match(COORD_PAIR);
  if (plain) {
    const coords = fromPair(plain[1], plain[2]);
    if (coords) return coords;
  }

  return null;
}

export function parsePartnerMapLink(input: string): ParsedMapLink | null {
  const coords = extractCoordsFromMapText(input);
  if (!coords) return null;

  // Prefer Nepal-plausible coords when both orderings could parse
  if (!isPlausibleNepalCoords(coords.latitude, coords.longitude)) {
    const swapped = extractCoordsFromMapText(`${coords.longitude}, ${coords.latitude}`);
    if (swapped && isPlausibleNepalCoords(swapped.latitude, swapped.longitude)) {
      const nearest = findNearestLocation(swapped.latitude, swapped.longitude);
      return {
        latitude: swapped.latitude,
        longitude: swapped.longitude,
        cityId: nearest.cityId,
        areaId: nearest.areaId,
      };
    }
  }

  const nearest = findNearestLocation(coords.latitude, coords.longitude);
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    cityId: nearest.cityId,
    areaId: nearest.areaId,
  };
}

export function looksLikeMapLink(input: string) {
  const t = input.trim().toLowerCase();
  return (
    t.includes('maps.google') ||
    t.includes('google.com/maps') ||
    t.includes('maps.app.goo.gl') ||
    t.includes('goo.gl/maps') ||
    t.includes('maps.apple.com') ||
    t.startsWith('geo:') ||
    COORD_PAIR.test(t)
  );
}

/** Follow short links (maps.app.goo.gl) once to uncover coords in the final URL. */
export async function resolveMapLink(input: string): Promise<ParsedMapLink | null> {
  const direct = parsePartnerMapLink(input);
  if (direct) return direct;

  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  try {
    const response = await fetch(trimmed, { method: 'GET', redirect: 'follow' });
    const finalUrl = response.url || trimmed;
    return parsePartnerMapLink(finalUrl);
  } catch {
    return null;
  }
}

export function buildGoogleMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
