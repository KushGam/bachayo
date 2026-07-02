import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

import { goBackOr } from '@/lib/navigation';

export function useSafeBack(fallback: Href) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    goBackOr(router, fallback);
  }, [router, fallback]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
  );

  return handleBack;
}
