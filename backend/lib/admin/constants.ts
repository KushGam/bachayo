export const ADMIN_CITIES = [
  { id: 'kathmandu', name: 'Kathmandu' },
  { id: 'lalitpur', name: 'Lalitpur' },
  { id: 'pokhara', name: 'Pokhara' },
  { id: 'bharatpur', name: 'Bharatpur' },
] as const;

export const TIER_PRICES_NPR: Record<string, number> = {
  small: 800,
  medium: 1800,
  large: 3500,
};

export const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  bakery: 'Bakery',
  mart: 'Mart',
  hotel: 'Hotel',
};
