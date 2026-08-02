/** Large-plan partners get featured placement in customer browse surfaces. */

type TieredPartner = {
  subscription_tier?: string | null;
};

type SortableBag = {
  partner: TieredPartner;
  distance_km?: number | null;
  rescue_price?: number | null;
};

const TIER_SORT_ORDER: Record<string, number> = {
  large: 0,
  medium: 1,
  small: 2,
};

export function isFeaturedPartner(partner: TieredPartner | null | undefined) {
  return partner?.subscription_tier === 'large';
}

/** Home feed: Large → Medium → Small (stable for equal tiers). */
export function sortBagsByFeaturedTier<T extends { partner: TieredPartner }>(bags: T[]): T[] {
  return [...bags].sort((a, b) => {
    const aOrder = TIER_SORT_ORDER[a.partner.subscription_tier ?? ''] ?? 1;
    const bOrder = TIER_SORT_ORDER[b.partner.subscription_tier ?? ''] ?? 1;
    return aOrder - bOrder;
  });
}

/** Explore list: featured first, then nearest, then cheapest. */
export function sortBagsFeaturedThenDistance<T extends SortableBag>(bags: T[]): T[] {
  return [...bags].sort((a, b) => {
    const aFeatured = isFeaturedPartner(a.partner) ? 0 : 1;
    const bFeatured = isFeaturedPartner(b.partner) ? 0 : 1;
    if (aFeatured !== bFeatured) return aFeatured - bFeatured;

    const aDist = a.distance_km ?? 999;
    const bDist = b.distance_km ?? 999;
    if (aDist !== bDist) return aDist - bDist;

    return (a.rescue_price ?? 0) - (b.rescue_price ?? 0);
  });
}
