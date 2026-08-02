import { formatTime12h, parsePickupDateTimeLocal } from '@/lib/helpers';

export type PickupWindowPhase = 'before' | 'open' | 'after';

/** Small buffer so clock skew doesn't block on-time customers. */
const BUFFER_MS = 5 * 60 * 1000;

export function timeToMinutes(time: string) {
  const [h, m] = time.slice(0, 5).split(':').map((v) => Number(v));
  return (h ?? 0) * 60 + (m ?? 0);
}

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

export type StoreHours = {
  opening_start: string;
  opening_end: string;
};

/** Pickup must sit fully inside store open–close when hours are set. */
export function getStoreHoursPickupError(
  pickupStart: string,
  pickupEnd: string,
  storeHours: StoreHours | null | undefined,
): string | null {
  if (!storeHours?.opening_start || !storeHours?.opening_end) return null;

  const open = timeToMinutes(storeHours.opening_start);
  const close = timeToMinutes(storeHours.opening_end);
  if (!(close > open)) return null;

  const start = timeToMinutes(pickupStart);
  const end = timeToMinutes(pickupEnd);
  const hoursLabel = formatPickupWindowRange(
    storeHours.opening_start,
    storeHours.opening_end,
  );

  if (start < open) {
    return `Pickup can’t start before your store opens (${formatTime12h(storeHours.opening_start)}). Store hours: ${hoursLabel}.`;
  }
  if (end > close) {
    return `Pickup can’t end after your store closes (${formatTime12h(storeHours.opening_end)}). Store hours: ${hoursLabel}.`;
  }
  return null;
}

export function isPickupWithinStoreHours(
  pickupStart: string,
  pickupEnd: string,
  storeHours: StoreHours | null | undefined,
) {
  return getStoreHoursPickupError(pickupStart, pickupEnd, storeHours) == null;
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
