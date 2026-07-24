import { computeBrowsePartnerDistance } from '@/lib/partnerBrowse';
import { isPartnerVisibleToCustomers, type PartnerSubscriptionFields } from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';
import type { HomeBag } from '@/store/useBagsStore';
import type { Partner } from '@/types/database';

type PartnerJoin = Partner & {
  city_id?: string | null;
  area_id?: string | null;
};

export function resolveNearbyOrigin(
  gpsCoords: { latitude: number; longitude: number } | null,
) {
  return gpsCoords;
}

export function filterVisibleNearbyBags(rows: unknown[]): HomeBag[] {
  return (rows ?? []).filter((row) => {
    const bag = row as HomeBag;
    const partner = bag.partner as PartnerJoin | undefined;
    if (!isPartnerVisibleToCustomers(partner as PartnerSubscriptionFields)) return false;
    return Boolean(partner);
  }) as HomeBag[];
}

export function attachNearbyBagDistances(
  bags: HomeBag[],
  origin: { latitude: number; longitude: number } | null,
): HomeBag[] {
  const withDistance = bags.map((bag) => {
    const partner = bag.partner as PartnerJoin;
    const distanceKm =
      origin == null
        ? null
        : computeBrowsePartnerDistance(origin, {
            latitude: partner.latitude,
            longitude: partner.longitude,
            area_id: partner.area_id ?? null,
          });
    return { ...bag, distance_km: distanceKm };
  });

  return withDistance.sort((a, b) => {
    if (a.distance_km == null && b.distance_km == null) return 0;
    if (a.distance_km == null) return 1;
    if (b.distance_km == null) return -1;
    return a.distance_km - b.distance_km;
  });
}

/** null maxDistanceKm = All (no cap) */
export function bagPassesNearbyDistanceFilter(
  bag: HomeBag,
  maxDistanceKm: number | null,
): boolean {
  if (maxDistanceKm == null || !Number.isFinite(maxDistanceKm)) return true;
  if (bag.distance_km == null) return true;
  return bag.distance_km <= maxDistanceKm;
}

export async function fetchNearbyRescueBags(today: string) {
  const { data, error } = await supabase
    .from('rescue_bags')
    .select('*, partner:partners!inner(*)')
    .eq('status', 'active')
    .eq('available_date', today)
    .eq('partner.approval_status', 'approved');

  return { data, error };
}
