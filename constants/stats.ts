/** Placeholder landing stats — swap for Supabase aggregates when live. */
export const LANDING_STATS = {
  foodSavedKg: 2400,
  restaurantCount: 180,
  city: 'Kathmandu',
} as const;

export function formatCountNumber(value: number) {
  return `${value.toLocaleString()}+`;
}
