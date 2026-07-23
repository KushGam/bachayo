import PartnerScanNative from '@/components/partner/PartnerScanNative';

/**
 * Partner pickup scan — camera QR + manual 6-digit code.
 * Uses expo-camera (works in Expo Go and EAS / store builds).
 */
export default function PartnerScanScreen() {
  return <PartnerScanNative />;
}
