export type SubscriptionTier = 'small' | 'medium' | 'large';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'paused' | 'cancelled';

export const SUBSCRIPTION_BADGE_COLORS = {
  trial: { bg: '#FAEEDA', text: '#854F0B' },
  active: { bg: '#EAF3DE', text: '#3B6D11' },
  past_due: { bg: '#FEE2E2', text: '#B91C1C' },
  paused: { bg: '#F1EFE8', text: '#5F5E5A' },
  cancelled: { bg: '#F1EFE8', text: '#5F5E5A' },
} as const;

export const TIER_SIGNUP_OPTIONS: {
  tier: SubscriptionTier;
  title: string;
  mealsLabel: string;
  priceLabel: string;
  avgDailyMeals: number;
}[] = [
  {
    tier: 'small',
    title: 'Small',
    mealsLabel: 'Under 50 meals/day',
    priceLabel: 'NPR 800/mo',
    avgDailyMeals: 25,
  },
  {
    tier: 'medium',
    title: 'Medium',
    mealsLabel: '50–200 meals/day',
    priceLabel: 'NPR 1,800/mo',
    avgDailyMeals: 125,
  },
  {
    tier: 'large',
    title: 'Large',
    mealsLabel: '200+ meals/day',
    priceLabel: 'NPR 3,500/mo',
    avgDailyMeals: 300,
  },
];

export const DEFAULT_TIER_PRICING: Record<
  SubscriptionTier,
  { monthlyPriceNpr: number; maxBagsPerMonth: number | null; label: string }
> = {
  small: { monthlyPriceNpr: 800, maxBagsPerMonth: 300, label: 'Small — cafe, bakery, home kitchen' },
  medium: {
    monthlyPriceNpr: 1800,
    maxBagsPerMonth: null,
    label: 'Medium — restaurant, bakery, cafe chain',
  },
  large: {
    monthlyPriceNpr: 3500,
    maxBagsPerMonth: null,
    label: 'Large — hotel, mart, multi-branch',
  },
};
