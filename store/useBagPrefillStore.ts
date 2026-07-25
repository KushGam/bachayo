import { create } from 'zustand';

export type BagPrefillData = {
  id?: string;
  title: string;
  title_np?: string | null;
  description?: string | null;
  original_price: number;
  rescue_price: number;
  quantity_available: number;
  max_per_customer?: number;
  pickup_start: string;
  pickup_end: string;
  image_url?: string | null;
  service_type?: 'takeaway' | 'dinein' | 'both';
  dinein_extra_charge?: number;
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
