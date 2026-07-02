import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import { BrandedLoading } from '@/components/brand/BrandedLoading';
import { bagToPrefill } from '@/lib/partnerBags';
import { supabase } from '@/lib/supabase';
import { useBagPrefillStore } from '@/store/useBagPrefillStore';
import type { RescueBag } from '@/types/database';

export default function EditBagScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      if (!id) {
        router.replace('/partner/add-bag');
        return;
      }

      const { data, error } = await supabase.from('rescue_bags').select('*').eq('id', id).maybeSingle();

      if (!error && data) {
        useBagPrefillStore.getState().setPrefill(bagToPrefill(data as RescueBag));
      }

      router.replace('/partner/add-bag');
    })();
  }, [id, router]);

  return (
    <View style={styles.screen}>
      <BrandedLoading />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
