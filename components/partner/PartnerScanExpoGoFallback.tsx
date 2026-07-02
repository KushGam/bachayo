import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ManualQREntry } from '@/components/partner/ManualQREntry';
import { PickupOrderSheet } from '@/components/partner/PickupOrderSheet';
import { PickupSuccessOverlay } from '@/components/partner/PickupSuccessOverlay';
import { usePartnerPickupFlow } from '@/hooks/usePartnerPickupFlow';

export default function PartnerScanExpoGoFallback() {
  const insets = useSafeAreaInsets();
  const pickup = usePartnerPickupFlow();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ManualQREntry onOrderFound={pickup.openOrder} />
      </ScrollView>

      <PickupOrderSheet
        visible={pickup.sheetVisible}
        order={pickup.foundOrder}
        confirming={pickup.confirming}
        onConfirm={() => void pickup.confirmPickup('partner_qr')}
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
    backgroundColor: '#F5F3EF',
  },
  content: {
    flexGrow: 1,
  },
});
