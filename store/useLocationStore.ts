import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getNeighbourhood } from '@/lib/geocoding';
import { getLaunchCity } from '@/lib/launchCities';
import { supabase } from '@/lib/supabase';

/** null = All (no distance cap) */
export type MaxDistanceKm = number | null;

async function persistCustomerLocation(latitude: number, longitude: number) {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return;
    await supabase
      .from('profiles')
      .update({
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_updated: new Date().toISOString(),
      } as never)
      .eq('id', userId);
  } catch (error) {
    console.warn('[location] failed to save last location:', error);
  }
}

type LocationStore = {
  maxDistanceKm: MaxDistanceKm;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  permissionDenied: boolean;
  browseAllBags: boolean;
  inLaunchCity: boolean;
  currentCity: string | null;
  neighbourhood: string | null;
  setMaxDistanceKm: (km: MaxDistanceKm) => void;
  setBrowseAllBags: (value: boolean) => void;
  requestLocation: () => Promise<boolean>;
};

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      maxDistanceKm: 5,
      latitude: null,
      longitude: null,
      isDefault: true,
      permissionDenied: false,
      browseAllBags: false,
      inLaunchCity: true,
      currentCity: null,
      neighbourhood: null,
      setMaxDistanceKm: (maxDistanceKm) => set({ maxDistanceKm }),
      setBrowseAllBags: (browseAllBags) => set({ browseAllBags }),
      requestLocation: async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          set({
            latitude: null,
            longitude: null,
            isDefault: true,
            permissionDenied: true,
            inLaunchCity: true,
            currentCity: null,
            neighbourhood: null,
          });
          return false;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const city = getLaunchCity(latitude, longitude);
        const neighbourhood = await getNeighbourhood(latitude, longitude);

        set({
          latitude,
          longitude,
          isDefault: false,
          permissionDenied: false,
          browseAllBags: false,
          inLaunchCity: city !== null,
          currentCity: city?.name ?? null,
          neighbourhood,
        });

        void persistCustomerLocation(latitude, longitude);
        return true;
      },
    }),
    {
      name: 'lastbag-location-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        maxDistanceKm: state.maxDistanceKm,
        latitude: state.latitude,
        longitude: state.longitude,
        isDefault: state.isDefault,
        permissionDenied: state.permissionDenied,
        browseAllBags: state.browseAllBags,
        inLaunchCity: state.inLaunchCity,
        currentCity: state.currentCity,
        neighbourhood: state.neighbourhood,
      }),
    },
  ),
);
