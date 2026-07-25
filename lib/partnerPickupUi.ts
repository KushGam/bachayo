import { Alert } from 'react-native';

import {
  confirmPartnerPickup,
  type ConfirmPartnerPickupResult,
  type PickupConfirmedBy,
} from '@/lib/orders';
import {
  getOutsidePickupWindowCopy,
  getPickupWindowPhase,
} from '@/lib/pickupWindow';
import type { PartnerOrderWithCustomer } from '@/types/app';

type BagWindow = {
  available_date: string;
  pickup_start: string;
  pickup_end: string;
};

function bagFromOrder(order: PartnerOrderWithCustomer): BagWindow | null {
  const bag = order.bag;
  if (!bag?.available_date || !bag.pickup_start || !bag.pickup_end) return null;
  return bag;
}

/** First confirm dialog — uses override wording when outside the pickup window. */
export function promptPartnerPickupConfirm(
  order: PartnerOrderWithCustomer,
  onConfirm: (allowOutsideWindow: boolean) => void,
) {
  const bag = bagFromOrder(order);
  const phase = bag
    ? getPickupWindowPhase(bag.available_date, bag.pickup_start, bag.pickup_end)
    : 'open';

  if (phase === 'open') {
    Alert.alert('Confirm pickup', 'Has the customer collected their bag and paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, confirmed ✓',
        onPress: () => onConfirm(false),
      },
    ]);
    return;
  }

  const copy = getOutsidePickupWindowCopy(phase, bag!.pickup_start, bag!.pickup_end);
  Alert.alert(
    copy.title,
    `${copy.body}\n\nOnly confirm if the customer is here and you’ve collected payment.`,
    [
      { text: 'Not yet', style: 'cancel' },
      {
        text: copy.confirmLabel,
        style: 'destructive',
        onPress: () => onConfirm(true),
      },
    ],
  );
}

/** If confirm was blocked for window, show override alert and retry. */
export async function confirmPartnerPickupWithOverridePrompt(
  order: PartnerOrderWithCustomer,
  confirmedBy: PickupConfirmedBy,
  partnerName?: string,
  allowOutsideWindow = false,
): Promise<ConfirmPartnerPickupResult> {
  const result = await confirmPartnerPickup(order, confirmedBy, partnerName, {
    allowOutsideWindow,
  });

  if (result.ok || !result.needsOverride) return result;

  return new Promise((resolve) => {
    Alert.alert(
      result.overrideTitle ?? 'Outside pickup window',
      result.overrideBody ??
        'This pickup is outside the listed window. Confirm only if you want to override.',
      [
        {
          text: 'Not yet',
          style: 'cancel',
          onPress: () => resolve({ ok: false }),
        },
        {
          text: result.overrideConfirmLabel ?? 'Override & confirm',
          style: 'destructive',
          onPress: () => {
            void confirmPartnerPickup(order, confirmedBy, partnerName, {
              allowOutsideWindow: true,
            }).then(resolve);
          },
        },
      ],
    );
  });
}
