export const PICKUP_LOCK_MS = 5000;

export function isPickupFetchBlocked(lastPickupTime: number): boolean {
  return Date.now() - lastPickupTime < PICKUP_LOCK_MS;
}

export function mergePendingPickups<T extends { id: string; status: string }>(
  orders: T[],
  pending: ReadonlySet<string>,
): T[] {
  return orders.map((order) =>
    pending.has(order.id) ? { ...order, status: 'picked_up' } : order,
  );
}

/** Apply fetched orders without reverting recent local pickups. */
export function applyFetchedOrdersWithPickupGuard<
  T extends { id: string; status: string; picked_up_at?: string | null },
>(fetched: T[], pending: ReadonlySet<string>, previous: T[]): T[] {
  return fetched.map((order) => {
    if (pending.has(order.id)) {
      const local = previous.find((row) => row.id === order.id);
      return {
        ...order,
        status: 'picked_up',
        picked_up_at: local?.picked_up_at ?? order.picked_up_at ?? new Date().toISOString(),
      };
    }

    const local = previous.find((row) => row.id === order.id);
    if (local?.status === 'picked_up' && order.status === 'confirmed') {
      return { ...order, status: 'picked_up', picked_up_at: local.picked_up_at ?? order.picked_up_at };
    }

    return order;
  });
}

export function protectPendingPickup(pending: Set<string>, orderId: string, ms = 10000) {
  pending.add(orderId);
  setTimeout(() => {
    pending.delete(orderId);
  }, ms);
}

/** @deprecated Use protectPendingPickup */
export function trackPendingPickup(pending: Set<string>, orderId: string, ms = 10000) {
  protectPendingPickup(pending, orderId, ms);
}
