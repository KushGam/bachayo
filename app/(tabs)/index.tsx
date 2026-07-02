import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { BrandedLoading } from '@/components/brand/BrandedLoading';
import { getTabsRouteForRole } from '@/lib/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuthStore } from '@/store/useAuthStore';

const ROLE_TIMEOUT_MS = 6000;

export default function TabsIndex() {
  const { role, roleLoaded } = useUserRole();

  useEffect(() => {
    if (roleLoaded) {
      return;
    }

    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().roleLoaded) {
        console.warn('[boot] tabs index role timeout — defaulting to customer home');
        useAuthStore.getState().setAuthRole(null);
      }
    }, ROLE_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [roleLoaded]);

  if (!roleLoaded) {
    return <BrandedLoading />;
  }

  return <Redirect href={getTabsRouteForRole(role)} />;
}
