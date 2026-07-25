import { formatTime12h, parsePickupDateTimeLocal } from '@/lib/helpers';

export type PickupWindowPhase = 'before' | 'open' | 'after';

/** Small buffer so clock skew doesn't block on-time customers. */
const BUFFER_MS = 5 * 60 * 1000;

export function getPickupWindowBounds(
  availableDate: string,
  pickupStart: string,
  pickupEnd: string,
) {
  const start = parsePickupDateTimeLocal(availableDate, pickupStart);
  const end = parsePickupDateTimeLocal(availableDate, pickupEnd);
  return { start, end };
}

export function getPickupWindowPhase(
  availableDate: string,
  pickupStart: string,
  pickupEnd: string,
  now = new Date(),
): PickupWindowPhase {
  const { start, end } = getPickupWindowBounds(availableDate, pickupStart, pickupEnd);
  const t = now.getTime();

  if (t < start.getTime() - BUFFER_MS) return 'before';
  if (t > end.getTime() + BUFFER_MS) return 'after';
  return 'open';
}

export function isWithinPickupWindow(
  availableDate: string,
  pickupStart: string,
  pickupEnd: string,
  now = new Date(),
) {
  return getPickupWindowPhase(availableDate, pickupStart, pickupEnd, now) === 'open';
}

export function formatPickupWindowRange(pickupStart: string, pickupEnd: string) {
  return `${formatTime12h(pickupStart)} – ${formatTime12h(pickupEnd)}`;
}

export function getOutsidePickupWindowCopy(
  phase: Exclude<PickupWindowPhase, 'open'>,
  pickupStart: string,
  pickupEnd: string,
) {
  const windowLabel = formatPickupWindowRange(pickupStart, pickupEnd);

  if (phase === 'before') {
    return {
      title: 'Early for pickup',
      body: `This bag’s pickup window is ${windowLabel}. The customer is early — you can still confirm if you’re ready to hand over the bag.`,
      confirmLabel: 'Override & confirm early pickup',
      badge: 'Early arrival',
    };
  }

  return {
    title: 'Pickup window ended',
    body: `This bag’s pickup window was ${windowLabel}. Confirm only if the customer is here and you’re okay releasing the bag late.`,
    confirmLabel: 'Override & confirm late pickup',
    badge: 'Late arrival',
  };
}
