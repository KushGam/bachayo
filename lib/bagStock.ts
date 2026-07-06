import { supabase } from '@/lib/supabase';

import type { HomeBag } from '@/store/useBagsStore';

type BagWithReserved = {
  id: string;
  quantity_reserved: number;
  quantity_available: number;
  status?: string;
};

export async function fetchBagReservedCounts(bagIds: string[]): Promise<Map<string, number>> {
  if (bagIds.length === 0) return new Map();

  const { data, error } = await supabase.rpc('get_bags_reserved_counts', {
    bag_ids: bagIds,
  });

  if (error) {
    console.warn('[bagStock] get_bags_reserved_counts failed:', error.message);
    return new Map();
  }

  const rows = (data ?? []) as Array<{ bag_id: string; reserved_quantity: number }>;
  return new Map(rows.map((row) => [row.bag_id, row.reserved_quantity]));
}

/** Apply live reserved counts from orders (max with column value). */
export function applyLiveReservedCounts<T extends BagWithReserved>(
  bags: T[],
  counts: Map<string, number>,
): T[] {
  return bags.map((bag) => {
    const live = counts.get(bag.id);
    if (live == null) return bag;

    const quantity_reserved = Math.max(bag.quantity_reserved ?? 0, live);
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

/** Keep in-memory stock bumps when DB/RPC is briefly behind. */
export function mergeCachedBagStock<T extends BagWithReserved>(
  bags: T[],
  cached: HomeBag[],
): T[] {
  if (cached.length === 0) return bags;

  const byId = new Map(cached.map((bag) => [bag.id, bag.quantity_reserved]));
  return bags.map((bag) => {
    const cachedReserved = byId.get(bag.id);
    if (cachedReserved == null) return bag;
    const quantity_reserved = Math.max(bag.quantity_reserved ?? 0, cachedReserved);
    return { ...bag, quantity_reserved };
  });
}

export async function enrichBagsWithLiveStock<T extends BagWithReserved>(
  bags: T[],
  cached: HomeBag[] = [],
): Promise<T[]> {
  const counts = await fetchBagReservedCounts(bags.map((bag) => bag.id));
  const withLive = applyLiveReservedCounts(bags, counts);
  return mergeCachedBagStock(withLive, cached);
}
