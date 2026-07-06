import { getTodayIsoDateLocal, partnerDistanceKm } from '@/lib/helpers';
import { getAreaById } from '@/lib/locations';
import { isPartnerVisibleToCustomers, type PartnerSubscriptionFields } from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';
import type { PartnerWithStats } from '@/types/app';
import type { Partner } from '@/types/database';

type PartnerRow = Partner & {
  city_id?: string | null;
  area_id?: string | null;
  approval_status?: string | null;
};

export type BrowsePartnerLocation = {
  latitude: number;
  longitude: number;
  area_id?: string | null;
};

export function computeBrowsePartnerDistance(
  origin: { latitude: number; longitude: number },
  partner: BrowsePartnerLocation,
): number | null {
  const fromCoords = partnerDistanceKm(origin, partner);
  if (fromCoords != null) return fromCoords;

  const partnerArea = partner.area_id ? getAreaById(partner.area_id) : null;
  if (!partnerArea) return null;

  return partnerDistanceKm(origin, {
    latitude: partnerArea.latitude,
    longitude: partnerArea.longitude,
  });
}

export function partnerPassesBrowseDistanceFilter(
  partner: { distance_km: number | null },
  maxDistanceKm: number,
): boolean {
  if (!Number.isFinite(maxDistanceKm)) return true;
  if (partner.distance_km == null) return false;
  return partner.distance_km <= maxDistanceKm;
}

export function countPartnersHiddenByDistance(
  partners: Array<{ distance_km: number | null }>,
  maxDistanceKm: number,
): number {
  return partners.filter(
    (partner) => partner.distance_km != null && partner.distance_km > maxDistanceKm,
  ).length;
}

function partnerInCity(partner: PartnerRow, cityId: string) {
  if (!partner.city_id) return cityId === 'kathmandu';
  return partner.city_id === cityId;
}

export async function fetchBrowsePartners(
  cityId: string,
  today = getTodayIsoDateLocal(),
): Promise<PartnerWithStats[]> {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('approval_status', 'approved');

  if (error) throw error;

  const visible = (data ?? []).filter((row) => {
    const partner = row as PartnerRow;
    if (!isPartnerVisibleToCustomers(partner as PartnerSubscriptionFields)) return false;
    return partnerInCity(partner, cityId);
  }) as PartnerRow[];

  if (visible.length === 0) return [];

  const partnerIds = visible.map((partner) => partner.id);
  const { data: bagRows, error: bagsError } = await supabase
    .from('rescue_bags')
    .select('partner_id')
    .eq('status', 'active')
    .eq('available_date', today)
    .in('partner_id', partnerIds);

  if (bagsError) throw bagsError;

  const bagCounts = new Map<string, number>();
  for (const row of bagRows ?? []) {
    bagCounts.set(row.partner_id, (bagCounts.get(row.partner_id) ?? 0) + 1);
  }

  return visible.map((partner) => ({
    ...partner,
    today_bag_count: bagCounts.get(partner.id) ?? 0,
  }));
}
