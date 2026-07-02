import { create } from 'zustand';

export type BagPrefillData = {
  id?: string;
  title: string;
  title_np?: string | null;
  description?: string | null;
  original_price: number;
  rescue_price: number;
  quantity_available: number;
  pickup_start: string;
  pickup_end: string;
  image_url?: string | null;
};

type BagPrefillState = {
  prefill: BagPrefillData | null;
  setPrefill: (data: BagPrefillData) => void;
  consumePrefill: () => BagPrefillData | null;
};

export const useBagPrefillStore = create<BagPrefillState>((set, get) => ({
  prefill: null,
  setPrefill: (prefill) => set({ prefill }),
  consumePrefill: () => {
    const data = get().prefill;
    set({ prefill: null });
    return data;
  },
}));
