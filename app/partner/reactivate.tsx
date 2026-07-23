import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { BrandedLoading } from '@/components/brand/BrandedLoading';

/**
 * Legacy reactivate route — partners now renew via manual billing on
 * Subscription & Billing (no fake gateway activate).
 */
export default function PartnerReactivateScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)/partner/subscription');
  }, [router]);

  return <BrandedLoading />;
}
