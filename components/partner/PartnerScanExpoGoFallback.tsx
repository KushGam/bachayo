import { ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ManualQREntry } from '@/components/partner/ManualQREntry';
import {
  PartnerScanChooser,
  type ScanMode,
} from '@/components/partner/PartnerScanChooser';
import { PartnerScanCameraUnavailable } from '@/components/partner/PartnerScanCameraUnavailable';
import { PickupOrderSheet } from '@/components/partner/PickupOrderSheet';
import { PickupSuccessOverlay } from '@/components/partner/PickupSuccessOverlay';
import { Palette } from '@/constants/Colors';
import { usePartnerPickupFlow } from '@/hooks/usePartnerPickupFlow';

export default function PartnerScanExpoGoFallback() {
  const insets = useSafeAreaInsets();
  const pickup = usePartnerPickupFlow();
  const [mode, setMode] = useState<ScanMode>('choose');

  return (
    <View style={[styles.screen, { paddingTop: mode === 'choose' ? 0 : insets.top }]}>
      {mode === 'choose' ? (
        <PartnerScanChooser onSelect={setMode} />
      ) : mode === 'qr' ? (
        <PartnerScanCameraUnavailable
          onBack={() => setMode('choose')}
          onEnterCode={() => setMode('manual')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ManualQREntry
            onBack={() => setMode('choose')}
            onOrderFound={pickup.openOrder}
          />
        </ScrollView>
      )}

      <PickupOrderSheet
        visible={pickup.sheetVisible}
        order={pickup.foundOrder}
        confirming={pickup.confirming}
        onConfirm={() => void pickup.confirmPickup('partner_manual')}
        onDismiss={pickup.dismissSheet}
      />

      <PickupSuccessOverlay
        visible={pickup.successVisible}
        customerName={pickup.successCustomerName}
        onDone={pickup.dismissSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    flexGrow: 1,
  },
});
