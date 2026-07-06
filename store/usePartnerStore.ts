import { create } from 'zustand';

import { fetchCurrentPartner } from '@/lib/currentPartner';
import type { Partner } from '@/types/database';

type PartnerStore = {
  partner: Partner | null;
  refreshPartner: () => Promise<Partner | null>;
  setPartner: (partner: Partner | null) => void;
  patchPartner: (patch: Partial<Partner>) => void;
  clearPartner: () => void;
};

export const usePartnerStore = create<PartnerStore>((set, get) => ({
  partner: null,
  refreshPartner: async () => {
    const partner = await fetchCurrentPartner();
    set({ partner });
    return partner;
  },
  setPartner: (partner) => set({ partner }),
  patchPartner: (patch) => {
    const current = get().partner;
    if (!current) return;
    set({ partner: { ...current, ...patch } });
  },
  clearPartner: () => set({ partner: null }),
}));
