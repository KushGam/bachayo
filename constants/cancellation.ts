import { getTodayIsoDateLocal, parsePickupDateTimeLocal } from '@/lib/helpers';

export const CANCELLATION_POLICY = {
  /** Can cancel freely up to this many minutes before pickup starts */
  freeCancel: 60,
  /** Between freeCancel and blockCancel: warn but allow */
  lateCancel: 30,
  /** Within this many minutes of pickup: block cancellation */
  blockCancel: 30,
} as const;

export type CancellationEligibility = 'free' | 'late' | 'blocked' | 'expired';

/** Use today's local date when bag date is missing or stale so pickup times aren't in the past. */
function resolvePickupDateForCancellation(availableDate: string): string {
  const today = getTodayIsoDateLocal();
  if (!availableDate || availableDate < today) {
    return today;
  }
  return availableDate;
}

export function getMinutesUntilPickupStart(
  availableDate: string,
  pickupStart: string,
): number {
  const pickupDate = resolvePickupDateForCancellation(availableDate);
  const pickupStartCombined = parsePickupDateTimeLocal(pickupDate, pickupStart);
  return (pickupStartCombined.getTime() - Date.now()) / 60000;
}

export function getCancellationEligibility(
  availableDate: string,
  pickupStart: string,
  pickupEnd: string,
): CancellationEligibility {
  const now = Date.now();
  const pickupDate = resolvePickupDateForCancellation(availableDate);
  const pickupStartAt = parsePickupDateTimeLocal(pickupDate, pickupStart);
  const pickupEndAt = parsePickupDateTimeLocal(pickupDate, pickupEnd);

  if (now > pickupEndAt.getTime()) {
    return 'expired';
  }

  const minutesUntilPickup = (pickupStartAt.getTime() - now) / 60000;

  console.log('pickup_start:', pickupStart);
  console.log('now:', new Date());
  console.log('available_date:', availableDate);
  console.log('pickupDate used:', pickupDate);
  console.log('pickupStart combined:', pickupStartAt);
  console.log('minutesUntilPickup:', minutesUntilPickup);

  if (minutesUntilPickup > CANCELLATION_POLICY.freeCancel) {
    return 'free';
  }
  if (minutesUntilPickup > CANCELLATION_POLICY.blockCancel) {
    return 'late';
  }
  return 'blocked';
}

export const CANCELLATION_REASONS = [
  "Can't make it",
  'Plans changed',
  'Found something else',
  'Ordered by mistake',
  'Other',
] as const;
