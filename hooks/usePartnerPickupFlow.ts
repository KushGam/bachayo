import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { track } from '@/lib/analytics';
import { hapticSuccess } from '@/lib/haptics';
import { confirmPartnerPickup, type PickupConfirmedBy } from '@/lib/orders';
import { getDisplayName } from '@/lib/privacy';
import { celebrateMilestoneOnce } from '@/lib/partnerMilestones';
import {
  getOutsidePickupWindowCopy,
  getPickupWindowPhase,
} from '@/lib/pickupWindow';
import type { PartnerOrderWithCustomer } from '@/types/app';

export function usePartnerPickupFlow(partnerName?: string) {
  const [foundOrder, setFoundOrder] = useState<PartnerOrderWithCustomer | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successCustomerName, setSuccessCustomerName] = useState('Customer');

  const openOrder = useCallback((order: PartnerOrderWithCustomer) => {
    setFoundOrder(order);
    setSheetVisible(true);
  }, []);

  const dismissSheet = useCallback(() => {
    setSheetVisible(false);
    setFoundOrder(null);
  }, []);

  const dismissSuccess = useCallback(() => {
    setSuccessVisible(false);
    setFoundOrder(null);
    setSheetVisible(false);
  }, []);

  const confirmPickup = useCallback(
    async (confirmedBy: PickupConfirmedBy, allowOutsideWindow = false) => {
      if (!foundOrder) return;

      const bag = foundOrder.bag;
      const phase =
        bag?.available_date && bag.pickup_start && bag.pickup_end
          ? getPickupWindowPhase(bag.available_date, bag.pickup_start, bag.pickup_end)
          : 'open';

      // Sheet already shows override CTA when outside window; still gate server-side.
      const shouldOverride = allowOutsideWindow || phase !== 'open';

      setConfirming(true);
      const result = await confirmPartnerPickup(foundOrder, confirmedBy, partnerName, {
        allowOutsideWindow: shouldOverride,
      });
      setConfirming(false);

      if (!result.ok) {
        if (result.needsOverride && bag?.pickup_start && bag.pickup_end && result.phase) {
          const copy = getOutsidePickupWindowCopy(
            result.phase,
            bag.pickup_start,
            bag.pickup_end,
          );
          Alert.alert(copy.title, copy.body, [
            { text: 'Not yet', style: 'cancel' },
            {
              text: copy.confirmLabel,
              style: 'destructive',
              onPress: () => void confirmPickup(confirmedBy, true),
            },
          ]);
          return;
        }
        Alert.alert('Error', result.errorMessage ?? 'Failed to confirm pickup. Please try again.');
        return;
      }

      track('pickup_completed', {
        order_id: foundOrder.id,
        partner_id: foundOrder.partner_id,
        method: confirmedBy,
        outside_window: phase !== 'open',
        window_phase: phase,
      });

      void hapticSuccess();
      void celebrateMilestoneOnce('pickupConfirmed');

      const name = getDisplayName(foundOrder.customer) || foundOrder.customer_name || 'Customer';

      setSuccessCustomerName(name);
      setSheetVisible(false);
      setSuccessVisible(true);
    },
    [foundOrder, partnerName],
  );

  return {
    foundOrder,
    sheetVisible,
    confirming,
    successVisible,
    successCustomerName,
    openOrder,
    dismissSheet,
    dismissSuccess,
    confirmPickup,
  };
}
