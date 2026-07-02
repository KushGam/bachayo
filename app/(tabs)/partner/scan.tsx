import { isExpoGo } from '@/lib/expoGo';

import PartnerScanExpoGoFallback from '@/components/partner/PartnerScanExpoGoFallback';

export default function PartnerScanScreen() {
  if (isExpoGo()) {
    return <PartnerScanExpoGoFallback />;
  }

  const PartnerScanNative = require('@/components/partner/PartnerScanNative').default as typeof import('@/components/partner/PartnerScanNative').default;
  return <PartnerScanNative />;
}
