import { Linking, Platform } from 'react-native';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNprPaisa(paisa: number): string {
  const npr = paisa / 100;
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(npr);
}

export function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 10) / 10} km away`;
  return `${distanceKm.toFixed(1)} km away`;
}

export function getTodayIsoDateLocal(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parsePickupDateTimeLocal(isoDate: string, timeHHMMSS: string): Date {
  const [y, m, d] = isoDate.split('-').map((v) => Number(v));
  const [hh, mm, ss] = timeHHMMSS.split(':').map((v) => Number(v));
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, ss ?? 0, 0);
}

export function getPickupCountdownLabel(availableDate: string, pickupEnd: string) {
  const end = parsePickupDateTimeLocal(availableDate, pickupEnd);
  const diffMs = end.getTime() - Date.now();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (mins <= 0) return 'Pickup window closed';
  if (hrs <= 0) return `Pickup in ${remMins}m`;
  return `Pickup in ${hrs}h ${remMins}m`;
}

export function openMapsDirections(latitude: number, longitude: number, label?: string) {
  const encoded = encodeURIComponent(label ?? 'Pickup location');
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encoded}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encoded})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  });
  if (url) Linking.openURL(url);
}
