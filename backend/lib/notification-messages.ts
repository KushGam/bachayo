export type NotificationType =
  | 'reservation'
  | 'cancellation'
  | 'pickup_reminder'
  | 'review_request'
  | 'bag_expiring'
  | 'subscription'
  | 'new_bag'
  | 'system';

export function formatPickupWindow(pickupStart: string, pickupEnd: string) {
  const fmt = (time: string) => {
    const [h, m] = time.slice(0, 5).split(':').map(Number);
    const period = h >= 12 ? 'pm' : 'am';
    const hour12 = h % 12 || 12;
    return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, '0')}${period}`;
  };
  return `${fmt(pickupStart)}–${fmt(pickupEnd)}`;
}

export function formatTime12h(time: string) {
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 || 12;
  return m === 0 ? `${hour12}:00${period}` : `${hour12}:${String(m).padStart(2, '0')}${period}`;
}

type NotificationPayload = {
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, unknown>;
};

export function customerReservationConfirmed(input: {
  orderId: string;
  bagId: string;
  partnerId: string;
  bagTitle: string;
  partnerName: string;
  pickupStart: string;
  pickupEnd: string;
}): NotificationPayload {
  const window = formatPickupWindow(input.pickupStart, input.pickupEnd);
  return {
    title: 'Bag reserved! 🛍',
    body: `Your ${input.bagTitle} at ${input.partnerName} is confirmed. Pick up ${window} today.`,
    type: 'reservation',
    data: {
      order_id: input.orderId,
      bag_id: input.bagId,
      partner_id: input.partnerId,
      orderId: input.orderId,
      bagId: input.bagId,
      type: 'reservation',
    },
  };
}

export function partnerNewReservation(input: {
  orderId: string;
  bagId: string;
  partnerId: string;
  customerName: string;
  quantity: number;
  bagTitle: string;
  pickupStart: string;
  pickupEnd: string;
}): NotificationPayload {
  const window = formatPickupWindow(input.pickupStart, input.pickupEnd);
  const qtyLabel = input.quantity === 1 ? '' : `${input.quantity}× `;
  return {
    title: 'New reservation! 🎉',
    body: `${input.customerName} reserved ${qtyLabel}${input.bagTitle}. Pickup ${window} · Pay at counter`,
    type: 'reservation',
    data: {
      order_id: input.orderId,
      bag_id: input.bagId,
      partner_id: input.partnerId,
      orderId: input.orderId,
      bagId: input.bagId,
      type: 'partner_dashboard',
    },
  };
}

export function customerPickupReminder(input: {
  orderId: string;
  partnerId: string;
  partnerName: string;
}): NotificationPayload {
  return {
    title: 'Pickup in 30 minutes ⏰',
    body: `Head to ${input.partnerName} for your rescue bag. Pay at the counter when you arrive.`,
    type: 'pickup_reminder',
    data: {
      order_id: input.orderId,
      partner_id: input.partnerId,
      orderId: input.orderId,
      type: 'pickup_reminder',
    },
  };
}

export function customerReviewRequest(input: {
  orderId: string;
  partnerId: string;
  partnerName: string;
}): NotificationPayload {
  return {
    title: 'How was your rescue bag? ⭐',
    body: `Rate your experience at ${input.partnerName} — it helps others find great bags!`,
    type: 'review_request',
    data: {
      order_id: input.orderId,
      partner_id: input.partnerId,
      orderId: input.orderId,
      type: 'review_request',
    },
  };
}

export function customerCancellationConfirmed(input: {
  orderId: string;
  bagId: string;
  bagTitle: string;
}): NotificationPayload {
  return {
    title: 'Reservation cancelled',
    body: `Your ${input.bagTitle} reservation has been cancelled. The slot is now free for others.`,
    type: 'cancellation',
    data: {
      order_id: input.orderId,
      bag_id: input.bagId,
      orderId: input.orderId,
      bagId: input.bagId,
      type: 'cancellation',
    },
  };
}

export function partnerCancellation(input: {
  orderId: string;
  bagId: string;
  customerName: string;
  bagTitle: string;
}): NotificationPayload {
  return {
    title: 'Reservation cancelled',
    body: `${input.customerName} cancelled their ${input.bagTitle} reservation. Slot is now free.`,
    type: 'cancellation',
    data: {
      order_id: input.orderId,
      bag_id: input.bagId,
      orderId: input.orderId,
      bagId: input.bagId,
      type: 'partner_dashboard',
    },
  };
}

export function partnerBagSoldOut(input: {
  bagId: string;
  partnerId: string;
  bagTitle: string;
}): NotificationPayload {
  return {
    title: 'All bags reserved! 🎉',
    body: `Your ${input.bagTitle} is fully booked today. Amazing work!`,
    type: 'system',
    data: {
      bag_id: input.bagId,
      partner_id: input.partnerId,
      bagId: input.bagId,
      type: 'partner_dashboard',
    },
  };
}

export function partnerTrialEnding(input: {
  partnerId: string;
  daysLeft: number;
}): NotificationPayload {
  return {
    title: `Trial ends in ${input.daysLeft} days ⚠️`,
    body: 'Add a payment method to keep your Bachayo listings live after your trial.',
    type: 'subscription',
    data: {
      partner_id: input.partnerId,
      days_left: input.daysLeft,
      type: 'subscription',
    },
  };
}

export function partnerBagExpiring(input: {
  bagId: string;
  partnerId: string;
  bagTitle: string;
  remaining: number;
  pickupEnd: string;
}): NotificationPayload {
  return {
    title: '1 hour left on your bag ⏱',
    body: `${input.remaining} bags of ${input.bagTitle} still available. Pickup closes at ${formatTime12h(input.pickupEnd)}.`,
    type: 'bag_expiring',
    data: {
      bag_id: input.bagId,
      partner_id: input.partnerId,
      bagId: input.bagId,
      type: 'bag_expiring',
    },
  };
}

export function customerNewBagNearby(input: {
  bagId: string;
  partnerId: string;
  partnerName: string;
  priceNpr: number;
  pickupStart: string;
  pickupEnd: string;
}): NotificationPayload {
  const window = formatPickupWindow(input.pickupStart, input.pickupEnd);
  return {
    title: 'New rescue bag nearby! 🛍',
    body: `${input.partnerName} just listed a bag for ₨${input.priceNpr}. Pickup ${window} — grab it before it's gone!`,
    type: 'new_bag',
    data: {
      bag_id: input.bagId,
      partner_id: input.partnerId,
      bagId: input.bagId,
      type: 'new_bag',
    },
  };
}

export function partnerSubscriptionReminder(input: {
  partnerId: string;
  title: string;
  body: string;
}): NotificationPayload {
  return {
    title: input.title,
    body: input.body,
    type: 'subscription',
    data: {
      partner_id: input.partnerId,
      type: 'subscription',
    },
  };
}
