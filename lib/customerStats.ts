import { ACTIVE_RESERVATION_STATUSES } from '@/lib/reservations';
import { supabase } from '@/lib/supabase';

export type CustomerImpactStats = {
  bagsRescued: number;
  moneySavedPaisa: number;
  reviewsGiven: number;
  activeReservations: number;
};

type PickedUpOrderRow = {
  quantity: number | null;
  bag: { original_price: number; rescue_price: number } | null;
};

export async function fetchCustomerImpactStats(userId: string): Promise<CustomerImpactStats> {
  const [{ data: orders, error: ordersError }, reviewsRes, activeRes] = await Promise.all([
    supabase
      .from('orders')
      .select('quantity, bag:rescue_bags(original_price, rescue_price)')
      .eq('customer_id', userId)
      .eq('status', 'picked_up'),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', userId),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', userId)
      .in('status', [...ACTIVE_RESERVATION_STATUSES]),
  ]);

  if (ordersError) throw ordersError;

  let bagsRescued = 0;
  let moneySavedPaisa = 0;

  for (const order of (orders ?? []) as PickedUpOrderRow[]) {
    const quantity = order.quantity ?? 1;
    bagsRescued += quantity;
    const bag = order.bag;
    if (bag?.original_price != null && bag?.rescue_price != null) {
      moneySavedPaisa += Math.max(0, bag.original_price - bag.rescue_price) * quantity;
    }
  }

  return {
    bagsRescued,
    moneySavedPaisa,
    reviewsGiven: reviewsRes.count ?? 0,
    activeReservations: activeRes.count ?? 0,
  };
}
