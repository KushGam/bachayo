export const PLANS = [
  {
    id: 'small',
    name: 'Small',
    nameNp: 'साना',
    tagline: 'Café, dhaba, home bakery',
    price: 1000,
    priceDisplay: 'NPR 1,000/mo',
    popular: false,
    color: '#6B7280',
    maxListingsPerDay: 5,
    features: ['Up to 5 bag listings / day', 'QR pickup', 'Email support'],
  },
  {
    id: 'medium',
    name: 'Medium',
    nameNp: 'मध्यम',
    tagline: 'Restaurant, bakery, café',
    price: 1500,
    priceDisplay: 'NPR 1,500/mo',
    popular: true,
    color: '#D85A30',
    maxListingsPerDay: 15,
    features: ['Up to 15 bag listings / day', 'Analytics', 'Priority support'],
  },
  {
    id: 'large',
    name: 'Large',
    nameNp: 'ठूलो',
    tagline: 'Hotel, mart, multi-branch',
    price: 3500,
    priceDisplay: 'NPR 3,500/mo',
    popular: false,
    color: '#1A1A1A',
    maxListingsPerDay: null, // unlimited
    features: [
      'Unlimited bag listings',
      'Multi-branch',
      'Featured placement',
      'Dedicated support',
    ],
  },
] as const;

export type PlanId = (typeof PLANS)[number]['id'];

export function getPlan(id: PlanId) {
  return PLANS.find((p) => p.id === id);
}

export function getPlanPrice(id: PlanId) {
  return getPlan(id)?.price ?? 0;
}

export function getMaxListings(planId: PlanId): number | null {
  return getPlan(planId)?.maxListingsPerDay ?? null;
}

/** null max = unlimited */
export function canAddListing(planId: PlanId, currentListingsToday: number): boolean {
  const max = getMaxListings(planId);
  if (max === null) return true;
  return currentListingsToday < max;
}

export function isDailyListingLimitError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : error instanceof Error
        ? error.message
        : String(error ?? '');
  return /listing_limit_reached|Daily listing limit/i.test(message);
}

export function isSubscriptionInactiveListingError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : error instanceof Error
        ? error.message
        : String(error ?? '');
  return /subscription_inactive|Subscription is/i.test(message);
}

export function getDiscountedPrice(planId: PlanId, months: 1 | 3 | 12): number {
  const price = getPlanPrice(planId);
  if (months === 3) return Math.round(price * 3 * 0.95);
  if (months === 12) return Math.round(price * 12 * 0.9);
  return price;
}

export function coercePlanId(value: string | null | undefined): PlanId {
  if (value === 'medium' || value === 'large' || value === 'small') return value;
  return 'small';
}
