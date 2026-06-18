import { create } from 'zustand';

import type { PartnerCategory, RescueBagStatus } from '@/types/database';
import type { RescueBagWithPartner } from '@/types/app';

export type HomeCategoryFilter =
  | 'all'
  | 'restaurant'
  | 'bakery'
  | 'dhaba'
  | 'hotel'
  | 'cafe';

export type HomeBag = RescueBagWithPartner & {
  distance_km: number | null;
  status: RescueBagStatus;
};

type BagsState = {
  bags: HomeBag[];
  selectedCategory: HomeCategoryFilter;
  setBags: (bags: HomeBag[]) => void;
  setSelectedCategory: (category: HomeCategoryFilter) => void;
  clear: () => void;
};

export const useBagsStore = create<BagsState>((set) => ({
  bags: [],
  selectedCategory: 'all',
  setBags: (bags) => set({ bags }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  clear: () => set({ bags: [], selectedCategory: 'all' }),
}));

