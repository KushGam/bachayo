import { CATEGORY_DEFAULTS } from '@/constants/partnerCategories';
import type { PartnerCategory } from '@/types/database';

function quantityFromCategory(category: PartnerCategory) {
  const { default: defaultQuantity, max: maxQuantity } = CATEGORY_DEFAULTS[category];
  return { defaultQuantity, maxQuantity };
}

export type BagPreset = {
  id: string;
  label: string;
  title: string;
  description: string;
  pickupStart: string;
  pickupEnd: string;
  originalPrice?: number;
  rescuePrice?: number;
};

export type PickupPreset = {
  label: string;
  start: string;
  end: string;
};

export type CategoryBagConfig = {
  ctaTagline: string;
  namePlaceholder: string;
  insideHint: string;
  priceRangeHint: string;
  defaultQuantity: number;
  maxQuantity: number;
  presets: BagPreset[];
  pickupPresets: PickupPreset[];
};

export const CATEGORY_BAG_CONFIG: Record<PartnerCategory, CategoryBagConfig> = {
  restaurant: {
    ctaTagline: "Turn tonight's surplus into revenue",
    namePlaceholder: 'e.g. Lunch surprise, Dal Bhat set',
    insideHint: 'Rice, dal, seasonal curry, pickle...',
    priceRangeHint: 'Usually Rs 400–800',
    ...quantityFromCategory('restaurant'),
    presets: [
      {
        id: 'lunch',
        label: 'Lunch bag',
        title: 'Lunch surprise bag',
        description: 'Dal bhat, seasonal curry, pickle, salad',
        pickupStart: '12:00',
        pickupEnd: '14:00',
        originalPrice: 600,
        rescuePrice: 250,
      },
      {
        id: 'dinner',
        label: 'Dinner bag',
        title: 'Dinner rescue bag',
        description: 'Rice, curry, vegetables, dessert',
        pickupStart: '20:00',
        pickupEnd: '22:00',
        originalPrice: 700,
        rescuePrice: 300,
      },
      {
        id: 'dalbhat',
        label: 'Dal Bhat set',
        title: 'Dal Bhat set',
        description: 'Full dal bhat with seasonal sides',
        pickupStart: '12:00',
        pickupEnd: '14:00',
        originalPrice: 500,
        rescuePrice: 200,
      },
    ],
    pickupPresets: [
      { label: 'Lunch 12–2pm', start: '12:00', end: '14:00' },
      { label: 'Dinner 8–10pm', start: '20:00', end: '22:00' },
    ],
  },
  cafe: {
    ctaTagline: "Don't let today's bakes go to waste",
    namePlaceholder: 'e.g. Morning pastry bag',
    insideHint: 'Pastry, sandwich, coffee or tea...',
    priceRangeHint: 'Usually Rs 300–600',
    ...quantityFromCategory('cafe'),
    presets: [
      {
        id: 'morning-snack',
        label: 'Morning snack bag',
        title: 'Morning snack bag',
        description: 'Pastry, sandwich, fruit',
        pickupStart: '07:00',
        pickupEnd: '09:00',
        originalPrice: 450,
        rescuePrice: 200,
      },
      {
        id: 'evening-snack',
        label: 'Evening snack bag',
        title: 'Evening snack bag',
        description: 'Sandwich, baked goods, snack mix',
        pickupStart: '17:00',
        pickupEnd: '19:00',
        originalPrice: 400,
        rescuePrice: 180,
      },
      {
        id: 'coffee-snack',
        label: 'Coffee + snack',
        title: 'Coffee + snack combo',
        description: 'Hot drink plus pastry or sandwich',
        pickupStart: '07:00',
        pickupEnd: '09:00',
        originalPrice: 500,
        rescuePrice: 220,
      },
    ],
    pickupPresets: [
      { label: 'Morning 7–9am', start: '07:00', end: '09:00' },
      { label: 'Evening 5–7pm', start: '17:00', end: '19:00' },
    ],
  },
  bakery: {
    ctaTagline: 'Fresh today — list before closing',
    namePlaceholder: 'e.g. Morning bakes mix',
    insideHint: 'Bread loaf, rolls, biscuits, pastry...',
    priceRangeHint: 'Usually Rs 200–500',
    ...quantityFromCategory('bakery'),
    presets: [
      {
        id: 'morning-bakes',
        label: 'Morning bakes',
        title: 'Morning bakes bag',
        description: 'Fresh bread, rolls, croissants',
        pickupStart: '07:00',
        pickupEnd: '09:00',
        originalPrice: 350,
        rescuePrice: 150,
      },
      {
        id: 'afternoon-mix',
        label: 'Afternoon mix',
        title: 'Afternoon bakery mix',
        description: 'Assorted pastries, biscuits, buns',
        pickupStart: '16:00',
        pickupEnd: '18:00',
        originalPrice: 300,
        rescuePrice: 130,
      },
    ],
    pickupPresets: [
      { label: 'Morning 7–9am', start: '07:00', end: '09:00' },
      { label: 'Afternoon 4–6pm', start: '16:00', end: '18:00' },
    ],
  },
  mart: {
    ctaTagline: 'Clear near-expiry stock today',
    namePlaceholder: 'e.g. Produce rescue bag',
    insideHint: 'Mixed vegetables, near-expiry produce...',
    priceRangeHint: 'Usually Rs 300–700',
    ...quantityFromCategory('mart'),
    presets: [
      {
        id: 'produce',
        label: 'Produce bag',
        title: 'Produce rescue bag',
        description: 'Mixed vegetables and fruits, near best-before',
        pickupStart: '10:00',
        pickupEnd: '18:00',
        originalPrice: 500,
        rescuePrice: 200,
      },
      {
        id: 'dairy',
        label: 'Dairy bag',
        title: 'Dairy rescue bag',
        description: 'Milk, yogurt, cheese near expiry',
        pickupStart: '10:00',
        pickupEnd: '18:00',
        originalPrice: 450,
        rescuePrice: 180,
      },
      {
        id: 'mixed',
        label: 'Mixed grocery',
        title: 'Mixed grocery bag',
        description: 'Assorted near-expiry groceries',
        pickupStart: '10:00',
        pickupEnd: '18:00',
        originalPrice: 600,
        rescuePrice: 250,
      },
    ],
    pickupPresets: [],
  },
  hotel: {
    ctaTagline: 'Share your buffet surplus',
    namePlaceholder: 'e.g. Breakfast buffet surplus',
    insideHint: 'Buffet items, desserts, bread, sides...',
    priceRangeHint: 'Usually Rs 800–1,500',
    ...quantityFromCategory('hotel'),
    presets: [
      {
        id: 'breakfast',
        label: 'Breakfast surplus',
        title: 'Breakfast buffet surplus',
        description: 'Bread, eggs, pastries, fruit, hot items',
        pickupStart: '10:00',
        pickupEnd: '11:00',
        originalPrice: 1200,
        rescuePrice: 500,
      },
      {
        id: 'dinner-buffet',
        label: 'Dinner buffet',
        title: 'Dinner buffet surplus',
        description: 'Curries, rice, sides, desserts from buffet',
        pickupStart: '22:00',
        pickupEnd: '23:00',
        originalPrice: 1500,
        rescuePrice: 650,
      },
    ],
    pickupPresets: [
      { label: 'Post-breakfast 10–11am', start: '10:00', end: '11:00' },
      { label: 'Post-dinner 10–11pm', start: '22:00', end: '23:00' },
    ],
  },
};

export function getCategoryBagConfig(category: PartnerCategory | null | undefined): CategoryBagConfig {
  return CATEGORY_BAG_CONFIG[category ?? 'restaurant'];
}

export const MART_BAG_TYPES = ['Produce', 'Dairy', 'Packaged', 'Mixed'] as const;
export type MartBagType = (typeof MART_BAG_TYPES)[number];
