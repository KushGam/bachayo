import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { track } from '@/lib/analytics';
import { hapticSuccess } from '@/lib/haptics';
import { confirmPartnerPickup, type PickupConfirmedBy } from '@/lib/orders';
import { getDisplayName } from '@/lib/privacy';
import { celebrateMilestoneOnce } from '@/lib/partnerMilestones';
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
    async (confirmedBy: PickupConfirmedBy) => {
      if (!foundOrder) return;

      setConfirming(true);
      const result = await confirmPartnerPickup(foundOrder, confirmedBy, partnerName);
      setConfirming(false);

      if (!result.ok) {
        Alert.alert('Error', 'Failed to confirm pickup. Please try again.');
        return;
      }

      track('pickup_completed', {
        order_id: foundOrder.id,
        partner_id: foundOrder.partner_id,
        method: confirmedBy,
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
