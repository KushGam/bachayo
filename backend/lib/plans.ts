export type Plan = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  popular: boolean;
  maxListings: number | null;
  features: {
    label: string;
    included: boolean;
  }[];
  cta: string;
};

export const PLANS: Plan[] = [
  {
    id: 'small',
    name: 'Small',
    tagline: 'Perfect for cafés, dhabas, and home bakeries',
    price: 1000,
    popular: false,
    maxListings: 5,
    features: [
      { label: 'Up to 5 bag listings per day', included: true },
      { label: 'QR code pickup verification', included: true },
      { label: 'Customer order management', included: true },
      { label: 'Email support', included: true },
      { label: 'Sales analytics', included: false },
      { label: 'Priority support', included: false },
      { label: 'Multi-branch support', included: false },
      { label: 'Featured placement', included: false },
    ],
    cta: 'Start free — no card needed',
  },
  {
    id: 'medium',
    name: 'Medium',
    tagline: 'For restaurants, bakeries, and growing cafés',
    price: 1500,
    popular: true,
    maxListings: 15,
    features: [
      { label: 'Up to 15 bag listings per day', included: true },
      { label: 'QR code pickup verification', included: true },
      { label: 'Customer order management', included: true },
      { label: 'Email support', included: true },
      { label: 'Sales analytics dashboard', included: true },
      { label: 'Priority support', included: true },
      { label: 'Multi-branch support', included: false },
      { label: 'Featured placement', included: false },
    ],
    cta: 'Start free — no card needed',
  },
  {
    id: 'large',
    name: 'Large',
    tagline: 'For hotels, marts, and multi-branch businesses',
    price: 3500,
    popular: false,
    maxListings: null,
    features: [
      { label: 'Unlimited bag listings per day', included: true },
      { label: 'QR code pickup verification', included: true },
      { label: 'Customer order management', included: true },
      { label: 'Email support', included: true },
      { label: 'Sales analytics dashboard', included: true },
      { label: 'Priority support', included: true },
      { label: 'Multi-branch support', included: true },
      { label: 'Featured placement in app', included: true },
    ],
    cta: 'Start free — no card needed',
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export const PLAN_IDS = PLANS.map((plan) => plan.id);
