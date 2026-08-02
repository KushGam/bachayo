import { getAreaById, getCityById } from '@/lib/locations';
import { formatPartnerLocationLabel } from '@/lib/partnerProfile';
import type { PartnerDetailData } from '@/lib/partnerDetail';

const AVATAR_COLORS = ['#D85A30', '#993C1D', '#B45309', '#065F46', '#1D4ED8', '#7C3AED'];

export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatNprFromPaisa(paisa: number) {
  const amount = Math.round(paisa / 100).toLocaleString('en-NP');
  return `₨ ${amount}`;
}

export function formatPartnerDistanceKm(distanceKm: number): string | null {
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 500) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m away`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km away`;
  return `${Math.round(distanceKm)} km away`;
}

export function formatPhoneDisplay(phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('977')) digits = digits.slice(3);
  return digits || phone;
}

export function shortLocationLabel(partner: PartnerDetailData['partner']) {
  const area = partner.area_id ? getAreaById(partner.area_id) : undefined;
  const city = partner.city_id ? getCityById(partner.city_id) : undefined;
  if (area && city) {
    const cityShort =
      city.id === 'kathmandu'
        ? 'KTM'
        : city.id === 'lalitpur'
          ? 'LTP'
          : city.id === 'bhaktapur'
            ? 'BKT'
            : city.name;
    return `${area.name}, ${cityShort}`;
  }
  return formatPartnerLocationLabel(partner);
}

export function formatPickupTime(start: string, end: string) {
  const fmt = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}
