import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

import { isExpoGo } from '@/lib/expoGo';
import type { BagServiceType } from '@/types/database';

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

/** Display prices as "Rs 1,450" per product spec. */
export function formatRsNpr(amountNpr: number): string {
  return `Rs ${Math.round(amountNpr).toLocaleString('en-NP')}`;
}

export function formatRsPaisa(paisa: number): string {
  return formatRsNpr(paisa / 100);
}

export function getBagServiceType(
  bag: { service_type?: string | null } | null | undefined,
): BagServiceType {
  const value = bag?.service_type;
  if (value === 'takeaway' || value === 'dinein' || value === 'both') return value;
  return 'both';
}

export function getBagDineInExtraPaisa(
  bag: { dinein_extra_charge?: number | null } | null | undefined,
): number {
  return Math.max(0, bag?.dinein_extra_charge ?? 0);
}

/** Short label for list cards, e.g. "🪑 Dine-in" or "🍽 Both · +₨20". */
export function formatBagServiceBadge(
  bag: {
    service_type?: string | null;
    dinein_extra_charge?: number | null;
  } | null | undefined,
): string | null {
  const serviceType = getBagServiceType(bag);
  const extra = getBagDineInExtraPaisa(bag);
  const extraLabel = extra > 0 ? ` · +${formatNprPaisa(extra)}` : '';

  if (serviceType === 'takeaway') return '🛍 Takeaway';
  if (serviceType === 'dinein') return `🪑 Dine-in${extraLabel}`;
  if (extra > 0) return `🍽 Both${extraLabel}`;
  return null;
}

/** First 6 chars of order QR (UUID) for manual partner entry. */
export function getOrderShortCode(qrCode: string): string {
  return qrCode.replace(/-/g, '').slice(0, 6).toUpperCase();
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

/** Correct lat/lng stored swapped (common in Nepal partner records). */
export function normalizeNepalCoords(latitude: number, longitude: number) {
  const latInNepal = latitude >= 26 && latitude <= 31;
  const lngInNepal = longitude >= 80 && longitude <= 89;
  const latLooksLikeLng = latitude >= 80 && latitude <= 89;
  const lngLooksLikeLat = longitude >= 26 && longitude <= 31;

  if (!latInNepal && latLooksLikeLng && lngLooksLikeLat) {
    return { latitude: longitude, longitude: latitude };
  }

  return { latitude, longitude };
}

export function partnerDistanceKm(
  origin: { latitude: number; longitude: number },
  partner: { latitude: number; longitude: number },
): number | null {
  const coords = normalizeNepalCoords(partner.latitude, partner.longitude);
  const km = haversineDistanceKm(origin, coords);
  if (!Number.isFinite(km) || km > 500) return null;
  return km;
}

export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 0.1) return 'Nearby 📍';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m away`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)}km away`;
  return `${Math.round(distanceKm)}km · Out of range`;
}

export function formatTodayBilingual() {
  const now = new Date();
  const en = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const np = now.toLocaleDateString('ne-NP', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return { en, np };
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function formatOrderTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NP', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function getYesterdayIsoDateLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

export async function openExternalUrl(
  urls: string | string[],
  fallbackMessage?: string,
): Promise<boolean> {
  const candidates = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  const inExpoGo = isExpoGo();

  for (const url of candidates) {
    const isHttp = /^https?:\/\//i.test(url);

    // Expo Go's host app can't open custom maps:// / comgooglemaps:// schemes.
    if (!isHttp && inExpoGo) continue;

    try {
      if (!isHttp) {
        const supported = await Linking.canOpenURL(url);
        if (!supported) continue;
      }
      await Linking.openURL(url);
      return true;
    } catch {
      // https links often still work via in-app browser when Linking rejects them.
      if (isHttp) {
        try {
          await WebBrowser.openBrowserAsync(url);
          return true;
        } catch {
          // Try the next candidate.
        }
      }
    }
  }

  if (fallbackMessage) {
    Alert.alert('Unable to open link', fallbackMessage);
  }
  return false;
}

export function openMapsDirections(latitude: number, longitude: number, label?: string) {
  const encoded = encodeURIComponent(label ?? 'Pickup location');
  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const appleHttps = `https://maps.apple.com/?daddr=${latitude},${longitude}&q=${encoded}`;
  const appleScheme = `maps://?daddr=${latitude},${longitude}&q=${encoded}`;
  const geo = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encoded})`;

  void (async () => {
    const opened = await openExternalUrl(
      Platform.OS === 'ios'
        ? [appleHttps, googleWeb, appleScheme]
        : Platform.OS === 'android'
          ? [googleWeb, geo]
          : [googleWeb],
    );
    if (!opened) {
      Alert.alert('Unable to open Maps', 'Could not open a maps app on this device.');
    }
  })();
}

type StoreMapsTarget = {
  latitude?: number | null;
  longitude?: number | null;
  name: string;
  address?: string | null;
};

function storeMapsQuery(target: StoreMapsTarget) {
  const { latitude, longitude, name, address } = target;
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  if (hasCoords) {
    return {
      hasCoords: true as const,
      latitude: latitude as number,
      longitude: longitude as number,
      label: name,
    };
  }

  const query = address?.trim() || name;
  return { hasCoords: false as const, query };
}

export function googleMapsStoreUrls(target: StoreMapsTarget): string[] {
  const parsed = storeMapsQuery(target);
  if (parsed.hasCoords) {
    const { latitude, longitude, label } = parsed;
    const q = encodeURIComponent(`${label} @${latitude},${longitude}`);
    // https first — works in Expo Go + production; native scheme only after.
    return [
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      `https://www.google.com/maps/search/?api=1&query=${q}`,
      `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}`,
    ];
  }
  const q = encodeURIComponent(parsed.query);
  return [`https://www.google.com/maps/search/?api=1&query=${q}`, `comgooglemaps://?q=${q}`];
}

export function appleMapsStoreUrls(target: StoreMapsTarget): string[] {
  const parsed = storeMapsQuery(target);
  if (parsed.hasCoords) {
    const { latitude, longitude, label } = parsed;
    const q = encodeURIComponent(label);
    return [
      `https://maps.apple.com/?ll=${latitude},${longitude}&q=${q}`,
      `maps://?ll=${latitude},${longitude}&q=${q}`,
    ];
  }
  const q = encodeURIComponent(parsed.query);
  return [`https://maps.apple.com/?q=${q}`, `maps://?q=${q}`];
}

/** @deprecated Prefer googleMapsStoreUrls */
export function googleMapsStoreUrl(target: StoreMapsTarget) {
  return googleMapsStoreUrls(target).find((url) => url.startsWith('https://')) ?? googleMapsStoreUrls(target)[0];
}

/** @deprecated Prefer appleMapsStoreUrls */
export function appleMapsStoreUrl(target: StoreMapsTarget) {
  return appleMapsStoreUrls(target).find((url) => url.startsWith('https://')) ?? appleMapsStoreUrls(target)[0];
}

/** Ask which maps app to use (iOS), or open Google Maps directly (Android). */
export function promptOpenStoreInMaps(target: StoreMapsTarget) {
  const openGoogle = () => {
    void (async () => {
      const opened = await openExternalUrl(googleMapsStoreUrls(target));
      if (!opened) {
        Alert.alert('Unable to open Maps', 'Could not open Google Maps on this device.');
      }
    })();
  };
  const openApple = () => {
    void (async () => {
      // Fall back to Google https if Apple links are blocked (common in Expo Go).
      const opened = await openExternalUrl([
        ...appleMapsStoreUrls(target),
        ...googleMapsStoreUrls(target),
      ]);
      if (!opened) {
        Alert.alert('Unable to open Maps', 'Could not open Maps on this device.');
      }
    })();
  };

  // Android / web: Google Maps only — no Apple Maps option.
  if (Platform.OS !== 'ios') {
    openGoogle();
    return;
  }

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: 'Open store location',
      message: 'Choose which maps app to use.',
      options: ['Cancel', 'Apple Maps', 'Google Maps'],
      cancelButtonIndex: 0,
    },
    (index) => {
      if (index === 1) openApple();
      if (index === 2) openGoogle();
    },
  );
}

export function formatTime12h(time: string) {
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 || 12;
  return m === 0 ? `${hour12}:00${period}` : `${hour12}:${String(m).padStart(2, '0')}${period}`;
}

function shiftIsoDateLocal(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatCompactPickupWindow(pickupStart: string, pickupEnd: string) {
  return `${formatTime12h(pickupStart)} – ${formatTime12h(pickupEnd)}`;
}

/** Today → time only; tomorrow → "Tomorrow · …"; else "Wed, 8 Jul · …" */
export function formatBagPickupLabel(
  availableDate: string,
  pickupStart: string,
  pickupEnd: string,
  today = getTodayIsoDateLocal(),
) {
  const window = formatCompactPickupWindow(pickupStart, pickupEnd);

  if (availableDate === today) {
    return window;
  }

  if (availableDate === shiftIsoDateLocal(today, 1)) {
    return `Tomorrow · ${window}`;
  }

  const dateLabel = new Date(`${availableDate}T12:00:00`).toLocaleDateString('en-NP', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return `${dateLabel} · ${window}`;
}

export function formatTodayPickupWindow(pickupStart: string, pickupEnd: string) {
  return `Today, ${formatTime12h(pickupStart)} – ${formatTime12h(pickupEnd)}`;
}

export function getPickupMinutesRemaining(availableDate: string, pickupEnd: string) {
  const end = parsePickupDateTimeLocal(availableDate, pickupEnd);
  return Math.max(0, Math.floor((end.getTime() - Date.now()) / 60000));
}

export function openPhoneDialer(phone: string) {
  const normalized = phone.replace(/\s+/g, '');
  if (normalized) {
    void Linking.openURL(`tel:${normalized}`).catch(() => {
      Alert.alert('Unable to call', 'Calling is not available on this device.');
    });
  }
}

export function openWhatsAppShare(message: string) {
  void openWhatsAppChat({ message });
}

/**
 * Opens WhatsApp with a prefilled message.
 * Do not gate on Linking.canOpenURL — on iOS/Expo Go it returns false for
 * whatsapp:// unless LSApplicationQueriesSchemes is set (dev/production builds).
 * openURL still works when WhatsApp is installed.
 */
export async function openWhatsAppChat({
  phone,
  message,
}: {
  phone?: string;
  message: string;
}) {
  const encoded = encodeURIComponent(message);
  const digits = (phone ?? '').replace(/\D/g, '');
  const displayPhone = digits ? `+${digits}` : 'support';

  const candidates = [
    digits
      ? `whatsapp://send?phone=${digits}&text=${encoded}`
      : `whatsapp://send?text=${encoded}`,
    digits
      ? `https://api.whatsapp.com/send?phone=${digits}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`,
    digits
      ? `https://wa.me/${digits}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`,
  ];

  for (const url of candidates) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // try next candidate
    }
  }

  if (digits) {
    await Clipboard.setStringAsync(digits);
  }

  Alert.alert(
    'Couldn’t open WhatsApp',
    digits
      ? `WhatsApp didn’t open from this build. Number copied: ${displayPhone}`
      : 'WhatsApp didn’t open from this build. Please message us manually.',
  );
  return false;
}
