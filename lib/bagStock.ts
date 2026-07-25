import { supabase } from '@/lib/supabase';

import type { HomeBag } from '@/store/useBagsStore';

type BagWithReserved = {
  id: string;
  quantity_reserved: number;
  quantity_available: number;
  status?: string;
};

export function bagRemainingSlots(bag: BagWithReserved) {
  return Math.max(0, (bag.quantity_available ?? 0) - (bag.quantity_reserved ?? 0));
}

/** True when the bag still has at least one bookable slot. */
export function isBagBookable(bag: BagWithReserved) {
  if (bag.status === 'sold_out' || bag.status === 'expired' || bag.status === 'cancelled') {
    return false;
  }
  return bagRemainingSlots(bag) > 0;
}

export async function fetchBagReservedCounts(bagIds: string[]): Promise<Map<string, number>> {
  if (bagIds.length === 0) return new Map();

  const { data, error } = await supabase.rpc('get_bags_reserved_counts', {
    bag_ids: bagIds,
  });

  if (error) {
    console.warn('[bagStock] get_bags_reserved_counts failed:', error.message);
    return new Map();
  }

  // Missing bag_id in the SUM result means 0 reserved — seed zeros so cancel can free slots.
  const counts = new Map(bagIds.map((id) => [id, 0]));
  const rows = (data ?? []) as Array<{ bag_id: string; reserved_quantity: number }>;
  for (const row of rows) {
    counts.set(row.bag_id, row.reserved_quantity);
  }
  return counts;
}

/** Apply live reserved counts from orders (live SUM is source of truth). */
export function applyLiveReservedCounts<T extends BagWithReserved>(
  bags: T[],
  counts: Map<string, number>,
): T[] {
  return bags.map((bag) => {
    const live = counts.get(bag.id);
    if (live == null) return bag;

    const quantity_reserved = live;
    const soldOut = quantity_reserved >= bag.quantity_available && bag.quantity_available > 0;

    return {
      ...bag,
      quantity_reserved,
      status:
        soldOut && bag.status === 'active'
          ? 'sold_out'
          : !soldOut && bag.status === 'sold_out'
            ? 'active'
            : bag.status,
    } as T;
  });
}

/**
 * Keep optimistic in-memory bumps only when live RPC did not return a count
 * for that bag (RPC lag / failure). Never inflate above a known live SUM.
 */
export function mergeCachedBagStock<T extends BagWithReserved>(
  bags: T[],
  cached: HomeBag[],
  liveCounts: Map<string, number> = new Map(),
): T[] {
  if (cached.length === 0) return bags;

  const byId = new Map(cached.map((bag) => [bag.id, bag.quantity_reserved]));
  return bags.map((bag) => {
    if (liveCounts.has(bag.id)) return bag;

    const cachedReserved = byId.get(bag.id);
    if (cachedReserved == null) return bag;
    const quantity_reserved = Math.max(bag.quantity_reserved ?? 0, cachedReserved);
    const soldOut = quantity_reserved >= bag.quantity_available && bag.quantity_available > 0;
    return {
      ...bag,
      quantity_reserved,
      status:
        soldOut && bag.status === 'active'
          ? 'sold_out'
          : !soldOut && bag.status === 'sold_out'
            ? 'active'
            : bag.status,
    };
  });
}

export async function enrichBagsWithLiveStock<T extends BagWithReserved>(
  bags: T[],
  cached: HomeBag[] = [],
): Promise<T[]> {
  const counts = await fetchBagReservedCounts(bags.map((bag) => bag.id));
  const withLive = applyLiveReservedCounts(bags, counts);
  return mergeCachedBagStock(withLive, cached, counts);
}
