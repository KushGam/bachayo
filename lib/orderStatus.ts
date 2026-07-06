import type { OrderStatus } from '@/types/database';

/** Legacy values before migration 012_free_reservation.sql */
type LegacyOrderStatus = 'paid' | 'refunded';

export type DbOrderStatus = OrderStatus | LegacyOrderStatus;

export function normalizeOrderStatus(status: string): OrderStatus {
  if (status === 'paid') return 'confirmed';
  if (status === 'refunded') return 'cancelled';
  return status as OrderStatus;
}

export function isReservedOrderStatus(status: string) {
  const normalized = normalizeOrderStatus(status);
  return normalized === 'confirmed' || normalized === 'pending';
}

export function isConfirmedOrderStatus(status: string) {
  return normalizeOrderStatus(status) === 'confirmed';
}

export function isRevenueOrderStatus(status: string) {
  const normalized = normalizeOrderStatus(status);
  return normalized === 'confirmed' || normalized === 'picked_up';
}

/** Cash collected — picked up orders only. */
export function isRealizedRevenueOrderStatus(status: string) {
  return normalizeOrderStatus(status) === 'picked_up';
}

/** Status written when creating a new reservation on legacy DBs. */
export const NEW_RESERVATION_DB_STATUS = 'paid' as const;

export const NEW_RESERVATION_APP_STATUS: OrderStatus = 'confirmed';

/** TEMPORARY — remove 'confirmed' before App Store launch (review flow testing). */
export const REVIEW_ELIGIBLE_STATUSES: OrderStatus[] = ['picked_up', 'confirmed'];

export function isReviewEligibleOrderStatus(status: string) {
  return REVIEW_ELIGIBLE_STATUSES.includes(normalizeOrderStatus(status));
}
