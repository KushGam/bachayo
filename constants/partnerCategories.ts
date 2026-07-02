import type { PartnerCategory } from '@/types/database';

export const PARTNER_CATEGORIES = [
  { id: 'restaurant', label: 'Restaurant', labelNp: 'रेस्टुरेन्ट', icon: '🍛' },
  { id: 'cafe', label: 'Cafe', labelNp: 'क्याफे', icon: '☕' },
  { id: 'bakery', label: 'Bakery', labelNp: 'बेकरी', icon: '🥐' },
  { id: 'mart', label: 'Mart', labelNp: 'मार्ट', icon: '🛒' },
  { id: 'hotel', label: 'Hotel', labelNp: 'होटल', icon: '🏨' },
] as const satisfies ReadonlyArray<{
  id: PartnerCategory;
  label: string;
  labelNp: string;
  icon: string;
}>;

export type PartnerCategoryOption = PartnerCategory;

export const PARTNER_CATEGORY_IDS = PARTNER_CATEGORIES.map((c) => c.id) as [
  PartnerCategory,
  ...PartnerCategory[],
];

export type HomeCategoryFilter = 'all' | PartnerCategory;

export const HOME_CATEGORY_FILTERS: {
  key: HomeCategoryFilter;
  label: string;
  labelNp: string;
  icon: string | null;
}[] = [
  { key: 'all', label: 'All', labelNp: 'सबै', icon: null },
  ...PARTNER_CATEGORIES.map((c) => ({
    key: c.id,
    label: c.label,
    labelNp: c.labelNp,
    icon: c.icon,
  })),
];

export function getCategoryById(id: PartnerCategory | string) {
  return PARTNER_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryLabel(id: PartnerCategory | string, locale: 'en' | 'np' = 'en') {
  const cat = getCategoryById(id);
  if (!cat) return String(id);
  return locale === 'np' ? cat.labelNp : cat.label;
}

export function getCategoryPillLabel(key: HomeCategoryFilter, locale: 'en' | 'np' = 'en') {
  const item = HOME_CATEGORY_FILTERS.find((f) => f.key === key);
  if (!item) return key;
  const label = locale === 'np' ? item.labelNp : item.label;
  if (!item.icon) return label;
  return `${item.icon} ${label}`;
}

export function toDbPartnerCategory(category: PartnerCategoryOption): PartnerCategory {
  return category;
}

export type CategoryQuantityDefaults = {
  default: number;
  min: number;
  max: number;
};

export const CATEGORY_DEFAULTS: Record<PartnerCategory, CategoryQuantityDefaults> = {
  restaurant: { default: 5, min: 1, max: 50 },
  cafe: { default: 5, min: 1, max: 50 },
  bakery: { default: 8, min: 1, max: 100 },
  mart: { default: 10, min: 1, max: 200 },
  hotel: { default: 10, min: 1, max: 100 },
};

export function getCategoryQuantityDefaults(
  category: PartnerCategory | string | null | undefined,
): CategoryQuantityDefaults {
  const id = (category ?? 'restaurant') as PartnerCategory;
  return CATEGORY_DEFAULTS[id] ?? CATEGORY_DEFAULTS.restaurant;
}
