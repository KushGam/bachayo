export const FOOD_PREFERENCE_OPTIONS = [
  { key: 'vegetarian', label: 'Vegetarian', profileLabel: '🥗 Vegetarian' },
  { key: 'vegan', label: 'Vegan', profileLabel: '🌱 Vegan' },
  { key: 'no_pork', label: 'No pork', profileLabel: '🚫🐷 No pork' },
  { key: 'halal', label: 'Halal', profileLabel: '☪️ Halal' },
  { key: 'no_seafood', label: 'No seafood', profileLabel: '🐟 No seafood' },
  { key: 'spicy', label: 'Spicy food lover', profileLabel: '🌶 Spicy food lover' },
  { key: 'no_nuts', label: 'No nuts', profileLabel: '🥜 No nuts' },
  { key: 'gluten_free', label: 'Gluten free', profileLabel: '🌾 Gluten free' },
] as const;

export type FoodPreferenceKey = (typeof FOOD_PREFERENCE_OPTIONS)[number]['key'];
