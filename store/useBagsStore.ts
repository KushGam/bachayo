import { create } from 'zustand';

import type { HomeCategoryFilter } from '@/constants/partnerCategories';
import type { RescueBagStatus } from '@/types/database';
import type { RescueBagWithPartner } from '@/types/app';

export type { HomeCategoryFilter } from '@/constants/partnerCategories';

export type HomeBag = RescueBagWithPartner & {
  distance_km: number | null;
  status: RescueBagStatus;
};

type BagsState = {
  bags: HomeBag[];
  selectedCategory: HomeCategoryFilter;
  setBags: (bags: HomeBag[]) => void;
  setSelectedCategory: (category: HomeCategoryFilter) => void;
  incrementBagReserved: (bagId: string, quantity: number) => void;
  applyBagStock: (
    bagId: string,
    stock: Partial<Pick<HomeBag, 'quantity_reserved' | 'quantity_available' | 'status'>>,
  ) => void;
  clear: () => void;
};

export const useBagsStore = create<BagsState>((set) => ({
  bags: [],
  selectedCategory: 'all',
  setBags: (bags) => set({ bags }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  incrementBagReserved: (bagId, quantity) =>
    set((state) => ({
      bags: state.bags.map((bag) => {
        if (bag.id !== bagId) return bag;
        const quantity_reserved = bag.quantity_reserved + quantity;
        return {
          ...bag,
          quantity_reserved,
          status:
            quantity_reserved >= bag.quantity_available ? 'sold_out' : bag.status,
        };
      }),
    })),
  applyBagStock: (bagId, stock) =>
    set((state) => ({
      bags: state.bags.map((bag) => (bag.id === bagId ? { ...bag, ...stock } : bag)),
    })),
  clear: () => set({ bags: [], selectedCategory: 'all' }),
}));
