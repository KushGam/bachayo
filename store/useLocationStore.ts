import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_AREA_ID, DEFAULT_CITY_ID } from '@/constants/locations';

type LocationStore = {
  cityId: string;
  areaId: string;
  setLocation: (cityId: string, areaId: string) => void;
};

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      cityId: DEFAULT_CITY_ID,
      areaId: DEFAULT_AREA_ID,
      setLocation: (cityId, areaId) => set({ cityId, areaId }),
    }),
    {
      name: 'bachayo-location',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cityId: state.cityId, areaId: state.areaId }),
    },
  ),
);
