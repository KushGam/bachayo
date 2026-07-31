import { formatRsPaisa, getTodayIsoDateLocal, parsePickupDateTimeLocal } from '@/lib/helpers';
import { isConfirmedOrderStatus, isReservedOrderStatus } from '@/lib/orderStatus';
import { reconcileMissedOrders } from '@/lib/orders';
import { sendNotification } from '@/lib/sendNotification';
import { supabase } from '@/lib/supabase';
import type { Order, Profile } from '@/types/database';

export type PartnerBagOrder = Order & {
  customer: Pick<Profile, 'id' | 'full_name' | 'phone'> & {
    privacy_settings?: Profile['privacy_settings'];
  };
};
import type { RescueBag, RescueBagStatus } from '@/types/database';

export type PartnerBagWithStats = RescueBag & {
  total_orders: number;
  confirmed_orders: number;
  reserved_orders: number;
  picked_up_orders: number;
  picked_up_bags: number;
  potential_revenue: number;
  revenue_earned: number;
  avg_rating: number | null;
};

export type PastPeriodLabel = 'Yesterday' | 'This week' | 'Last week' | 'Earlier';

async function reconcileMissedOrdersQuietly() {
  try {
    await reconcileMissedOrders();
  } catch {
    // Cron / next open will catch up if RPC is unavailable.
  }
}

function shiftIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function orderStatsForBag(
  bagId: string,
  orders: Array<{
    bag_id: string;
    status: string;
    total_price: number;
    quantity?: number;
    order_id?: string;
    rating?: number | null;
  }>,
) {
  const bagOrders = orders.filter((order) => order.bag_id === bagId);
  const confirmed = bagOrders.filter((order) => isConfirmedOrderStatus(order.status)).length;
  const reserved = bagOrders.filter((order) => isReservedOrderStatus(order.status)).length;
  const pickedUpOrders = bagOrders.filter((order) => order.status === 'picked_up');
  const pickedUp = pickedUpOrders.length;
  const pickedUpBags = pickedUpOrders.reduce((sum, order) => sum + (order.quantity ?? 1), 0);
  const activeOrders = bagOrders.filter((order) => isReservedOrderStatus(order.status));
  const potentialRevenue = activeOrders.reduce((sum, order) => sum + order.total_price, 0);
  const revenue = pickedUpOrders.reduce((sum, order) => sum + order.total_price, 0);
  const ratings = bagOrders.map((order) => order.rating).filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
    : null;

  return {
    total_orders: bagOrders.length,
    confirmed_orders: confirmed,
    reserved_orders: reserved,
    picked_up_orders: pickedUp,
    picked_up_bags: pickedUpBags,
    potential_revenue: potentialRevenue,
    revenue_earned: revenue,
    avg_rating: avgRating,
  };
}

async function fetchOrdersForBags(partnerId: string, bagIds: string[]) {
  if (bagIds.length === 0) return [];

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, bag_id, status, total_price, quantity')
    .eq('partner_id', partnerId)
    .in('bag_id', bagIds);

  if (error) throw error;

  const orderIds = (orders ?? []).map((order) => order.id);
  let reviewMap = new Map<string, number>();

  if (orderIds.length > 0) {
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('order_id, rating')
      .in('order_id', orderIds);

    if (reviewError) throw reviewError;
    reviewMap = new Map((reviews ?? []).map((review) => [review.order_id, review.rating]));
  }

  return (orders ?? []).map((order) => ({
    bag_id: order.bag_id,
    status: order.status,
    total_price: order.total_price,
    quantity: order.quantity,
    order_id: order.id,
    rating: reviewMap.get(order.id) ?? null,
  }));
}

function occupiedQuantityForBag(
  bagId: string,
  orderRows: Array<{ bag_id: string; status: string; quantity?: number }>,
) {
  return orderRows
    .filter(
      (order) =>
        order.bag_id === bagId &&
        (isReservedOrderStatus(order.status) || order.status === 'picked_up'),
    )
    .reduce((sum, order) => sum + (order.quantity ?? 1), 0);
}

function enrichBags(
  bags: RescueBag[],
  orderRows: Array<{
    bag_id: string;
    status: string;
    total_price: number;
    quantity?: number;
    order_id?: string;
    rating?: number | null;
  }>,
): PartnerBagWithStats[] {
  return bags.map((bag) => {
    const occupiedQty = occupiedQuantityForBag(bag.id, orderRows);
    const capacity = bag.quantity_available ?? 0;
    const nextStatus =
      bag.status === 'expired' || bag.status === 'cancelled'
        ? bag.status
        : capacity > 0 && occupiedQty >= capacity
          ? 'sold_out'
          : bag.status === 'sold_out' && occupiedQty < capacity
            ? 'active'
            : bag.status;

    return {
      ...bag,
      ...orderStatsForBag(bag.id, orderRows),
      quantity_reserved: Math.max(bag.quantity_reserved ?? 0, occupiedQty),
      status: nextStatus,
    };
  });
}

export async function fetchPartnerBagsForDate(partnerId: string, date: string) {
  await reconcileMissedOrdersQuietly();

  const { data, error } = await supabase
    .from('rescue_bags')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('available_date', date)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const bags = data ?? [];
  const orderRows = await fetchOrdersForBags(
    partnerId,
    bags.map((bag) => bag.id),
  );
  return enrichBags(bags, orderRows);
}

export async function fetchPartnerUpcomingBags(partnerId: string, today = getTodayIsoDateLocal()) {
  const { data, error } = await supabase
    .from('rescue_bags')
    .select('*')
    .eq('partner_id', partnerId)
    .gt('available_date', today)
    .order('available_date', { ascending: true });

  if (error) throw error;
  const bags = data ?? [];
  const orderRows = await fetchOrdersForBags(
    partnerId,
    bags.map((bag) => bag.id),
  );
  return enrichBags(bags, orderRows);
}

export async function fetchPartnerPastBags(partnerId: string, today = getTodayIsoDateLocal(), days = 30) {
  await reconcileMissedOrdersQuietly();

  const fromDate = shiftIsoDate(today, -days);
  const { data, error } = await supabase
    .from('rescue_bags')
    .select('*')
    .eq('partner_id', partnerId)
    .lt('available_date', today)
    .gte('available_date', fromDate)
    .order('available_date', { ascending: false });

  if (error) throw error;
  const bags = data ?? [];
  const orderRows = await fetchOrdersForBags(
    partnerId,
    bags.map((bag) => bag.id),
  );
  return enrichBags(bags, orderRows);
}

export async function fetchPartnerBagOrders(
  bagId: string,
  options?: { includeCancelled?: boolean },
) {
  await reconcileMissedOrdersQuietly();

  const statuses = options?.includeCancelled
    ? (['confirmed', 'picked_up', 'pending', 'cancelled', 'missed'] as const)
    : (['confirmed', 'picked_up', 'pending'] as const);

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:profiles(id, full_name, phone, privacy_settings)
    `)
    .eq('bag_id', bagId)
    .in('status', [...statuses])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as PartnerBagOrder[];
}

export function getYesterdayIso(today = getTodayIsoDateLocal()) {
  return shiftIsoDate(today, -1);
}

export function formatPickupWindow(start: string, end: string) {
  const format = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  return `🕐 ${format(start)} – ${format(end)}`;
}

export function formatBagDateLabel(isoDate: string, today = getTodayIsoDateLocal()) {
  const tomorrow = shiftIsoDate(today, 1);
  if (isoDate === tomorrow) return 'Tomorrow';
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-NP', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function getPastPeriodLabel(isoDate: string, today = getTodayIsoDateLocal()): PastPeriodLabel {
  const yesterday = shiftIsoDate(today, -1);
  if (isoDate === yesterday) return 'Yesterday';

  const date = new Date(`${isoDate}T12:00:00`);
  const todayDate = new Date(`${today}T12:00:00`);
  const diffDays = Math.floor((todayDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return 'This week';
  if (diffDays <= 14) return 'Last week';
  return 'Earlier';
}

export type CountdownState =
  | { kind: 'closed' }
  | { kind: 'muted'; label: string }
  | { kind: 'amber'; label: string }
  | { kind: 'urgent'; label: string };

function formatPickupTimeLabel(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function getBagCountdownState(
  availableDate: string,
  pickupStart: string,
  pickupEnd: string,
  now = Date.now(),
): CountdownState {
  const end = parsePickupDateTimeLocal(availableDate, pickupEnd).getTime();
  if (now >= end) return { kind: 'closed' };

  const minsLeft = Math.max(0, Math.floor((end - now) / 60000));

  if (minsLeft > 180) {
    return {
      kind: 'muted',
      label: `🕐 Pickup ${formatPickupTimeLabel(pickupStart)} – ${formatPickupTimeLabel(pickupEnd)}`,
    };
  }

  const hours = Math.floor(minsLeft / 60);
  const mins = minsLeft % 60;
  const duration =
    hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;

  if (minsLeft < 60) {
    return { kind: 'urgent', label: `🔴 Closes in ${minsLeft}min!` };
  }

  return { kind: 'amber', label: `⏱ Closes in ${duration}` };
}

export function getBagDisplayStatus(bag: RescueBag, now = Date.now()): RescueBagStatus | 'expired' {
  if (bag.status === 'sold_out') return 'sold_out';
  if (bag.status === 'cancelled' || bag.status === 'expired') return 'expired';
  const end = parsePickupDateTimeLocal(bag.available_date, bag.pickup_end).getTime();
  if (end < now) return 'expired';
  return bag.status;
}

export function getSavingsPct(originalPaisa: number, rescuePaisa: number) {
  if (originalPaisa <= 0) return 0;
  return Math.round(((originalPaisa - rescuePaisa) / originalPaisa) * 100);
}

export function formatNprFromPaisa(paisa: number) {
  return formatRsPaisa(paisa).replace('Rs ', '₨ ');
}

export function getRelistBadge(bag: PartnerBagWithStats) {
  if (bag.status === 'sold_out' || bag.reserved_orders >= bag.quantity_available) {
    return { label: '🎉 Sold out', tone: 'green' as const };
  }
  if (bag.picked_up_orders > 0 || bag.reserved_orders > 0) {
    return { label: `⚡ ${bag.picked_up_orders || bag.reserved_orders} sold`, tone: 'amber' as const };
  }
  return { label: '0 orders', tone: 'gray' as const };
}

export function getPastPerformanceBadge(bag: PartnerBagWithStats) {
  if (bag.quantity_available > 0 && bag.picked_up_orders >= bag.quantity_available) {
    return { kind: 'sold_out' as const, label: '✓' };
  }
  if (bag.picked_up_orders > 0) {
    const pct = Math.round((bag.picked_up_orders / bag.quantity_available) * 100);
    return { kind: 'partial' as const, label: `${pct}%` };
  }
  return { kind: 'none' as const, label: '0' };
}

export function bagToPrefill(
  bag: Pick<
    RescueBag,
    | 'id'
    | 'title'
    | 'title_np'
    | 'description'
    | 'original_price'
    | 'rescue_price'
    | 'quantity_available'
    | 'max_per_customer'
    | 'pickup_start'
    | 'pickup_end'
    | 'image_url'
    | 'service_type'
    | 'dinein_extra_charge'
  >,
) {
  return {
    id: bag.id,
    title: bag.title,
    title_np: bag.title_np,
    description: bag.description,
    original_price: bag.original_price,
    rescue_price: bag.rescue_price,
    quantity_available: bag.quantity_available,
    max_per_customer: bag.max_per_customer,
    pickup_start: bag.pickup_start,
    pickup_end: bag.pickup_end,
    image_url: bag.image_url,
    service_type: bag.service_type ?? 'both',
    dinein_extra_charge: Math.max(0, bag.dinein_extra_charge ?? 0),
  };
}

export function isPartnerBagLiveToday(bag: PartnerBagWithStats) {
  // Still selling, or sold out with customers still waiting to pick up.
  if (bag.status === 'active') return true;
  if (bag.status === 'sold_out' && bag.reserved_orders > 0) return true;
  return false;
}

export function computeTodaySummary(bags: PartnerBagWithStats[]) {
  const liveBags = bags.filter(isPartnerBagLiveToday);
  const listed = liveBags.length;
  const reserved = bags.reduce((sum, bag) => sum + Math.max(0, bag.reserved_orders), 0);
  const potentialRevenue = bags.reduce((sum, bag) => sum + bag.potential_revenue, 0);
  const earned = bags.reduce((sum, bag) => sum + bag.revenue_earned, 0);
  return { listed, reserved, potentialRevenue, earned };
}

export function getBagPotentialRevenuePaisa(
  bag: PartnerBagWithStats,
  orders?: PartnerBagOrder[] | null,
) {
  if (orders) {
    return orders
      .filter((order) => isReservedOrderStatus(order.status))
      .reduce((sum, order) => sum + (order.total_price || 0), 0);
  }
  return bag.potential_revenue;
}

export function applyReservationToPartnerBag(
  bag: PartnerBagWithStats,
  quantity: number,
  status: string,
  totalPricePaisa = 0,
): PartnerBagWithStats {
  const qty = Math.max(1, quantity);
  const reserved = isReservedOrderStatus(status);
  const confirmed = isConfirmedOrderStatus(status);

  return {
    ...bag,
    quantity_reserved: bag.quantity_reserved + qty,
    total_orders: bag.total_orders + 1,
    reserved_orders: reserved ? bag.reserved_orders + 1 : bag.reserved_orders,
    confirmed_orders: confirmed ? bag.confirmed_orders + 1 : bag.confirmed_orders,
    potential_revenue: reserved ? bag.potential_revenue + totalPricePaisa : bag.potential_revenue,
    status:
      bag.quantity_available > 0 && bag.quantity_reserved + qty >= bag.quantity_available
        ? 'sold_out'
        : bag.status,
  };
}

export function applyBagStockPatch(
  bag: PartnerBagWithStats,
  patch: Partial<Pick<PartnerBagWithStats, 'quantity_reserved' | 'quantity_available' | 'status'>>,
): PartnerBagWithStats {
  return { ...bag, ...patch };
}

export function shouldShowBagEarnedRevenue(bag: PartnerBagWithStats) {
  return bag.quantity_reserved === 0 && bag.revenue_earned > 0;
}

export function computePastSummary(bags: PartnerBagWithStats[]) {
  const listed = bags.length;
  const sold = bags.reduce((sum, bag) => sum + bag.picked_up_bags, 0);
  const earned = bags.reduce((sum, bag) => sum + bag.revenue_earned, 0);
  return { listed, sold, earned };
}

export function groupPastBags(bags: PartnerBagWithStats[], today = getTodayIsoDateLocal()) {
  const groups = new Map<PastPeriodLabel, PartnerBagWithStats[]>();
  const order: PastPeriodLabel[] = ['Yesterday', 'This week', 'Last week', 'Earlier'];

  for (const bag of bags) {
    const label = getPastPeriodLabel(bag.available_date, today);
    const list = groups.get(label) ?? [];
    list.push(bag);
    groups.set(label, list);
  }

  return order
    .filter((label) => groups.has(label))
    .map((label) => ({ label, bags: groups.get(label) ?? [] }));
}

export type DeletePartnerBagResult =
  | {
      ok: false;
      reason: 'has_reservations';
      reservedCount: number;
      message: string;
    }
  | {
      ok: true;
      mode: 'soft_cancelled' | 'hard_deleted';
      cancelledOrders: number;
      notifiedCount: number;
    }
  | {
      ok: false;
      reason: 'error';
      message: string;
    };

type BagCancelReason = 'deleted' | 'sold_out' | 'cancelled';

type NestedBagPartner = {
  title?: string | null;
  partners?: { name?: string | null } | { name?: string | null }[] | null;
};

function unwrapPartnerName(bag: NestedBagPartner | NestedBagPartner[] | null | undefined) {
  const row = Array.isArray(bag) ? bag[0] : bag;
  const partners = row?.partners;
  const partner = Array.isArray(partners) ? partners[0] : partners;
  return partner?.name?.trim() || 'The restaurant';
}

function unwrapBagTitle(bag: NestedBagPartner | NestedBagPartner[] | null | undefined) {
  const row = Array.isArray(bag) ? bag[0] : bag;
  return row?.title?.trim() || 'Rescue bag';
}

/**
 * Cancel confirmed (and pending) reservations for a bag and notify each customer.
 * Used when a partner marks sold out, cancels, or deletes a bag.
 */
export async function cancelBagWithCustomerNotification(input: {
  bagId: string;
  reason: BagCancelReason;
  partnerName?: string;
}): Promise<{ success: boolean; notifiedCount: number; error?: string }> {
  const { bagId, reason, partnerName: partnerNameOverride } = input;

  const { data: activeOrders, error: ordersError } = await supabase
    .from('orders')
    .select(
      `
      id,
      customer_id,
      quantity,
      rescue_bags (
        title,
        partners (name)
      )
    `,
    )
    .eq('bag_id', bagId)
    .in('status', ['pending', 'confirmed']);

  if (ordersError) {
    return { success: false, notifiedCount: 0, error: ordersError.message };
  }

  const rows = activeOrders ?? [];
  const bagTitle = unwrapBagTitle(
    rows[0]?.rescue_bags as NestedBagPartner | NestedBagPartner[] | null | undefined,
  );
  const partnerName =
    partnerNameOverride?.trim() ||
    unwrapPartnerName(
      rows[0]?.rescue_bags as NestedBagPartner | NestedBagPartner[] | null | undefined,
    );

  if (rows.length > 0) {
    const { error: cancelOrdersError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: 'Partner cancelled this bag',
        cancelled_at: new Date().toISOString(),
      } as never)
      .eq('bag_id', bagId)
      .in('status', ['pending', 'confirmed']);

    if (cancelOrdersError) {
      return { success: false, notifiedCount: 0, error: cancelOrdersError.message };
    }

    await supabase
      .from('rescue_bags')
      .update({ quantity_reserved: 0 } as never)
      .eq('id', bagId);

    let notifiedCount = 0;
    const title = 'Reservation cancelled 😔';
    const body = `${partnerName} has cancelled their ${bagTitle} bag today. Your reservation has been automatically cancelled.`;

    for (const order of rows) {
      if (!order.customer_id) continue;
      try {
        await sendNotification({
          userId: order.customer_id,
          title,
          body,
          type: 'bag_cancelled',
          data: {
            order_id: order.id,
            bag_id: bagId,
            orderId: order.id,
            bagId,
            type: 'bag_cancelled',
            reason,
          },
        });
        notifiedCount += 1;
      } catch (notifyError) {
        console.warn('[cancelBagWithCustomerNotification] notify failed:', notifyError);
      }
    }

    return { success: true, notifiedCount };
  }

  return { success: true, notifiedCount: 0 };
}

/**
 * Mark bag sold_out / cancelled and notify customers with active reservations.
 */
export async function markBagUnavailableWithNotification(input: {
  bagId: string;
  reason: 'sold_out' | 'cancelled';
  partnerName?: string;
}): Promise<{ success: boolean; notifiedCount: number; error?: string }> {
  const notifyResult = await cancelBagWithCustomerNotification({
    bagId: input.bagId,
    reason: input.reason,
    partnerName: input.partnerName,
  });

  if (!notifyResult.success) {
    return notifyResult;
  }

  const { error } = await supabase
    .from('rescue_bags')
    .update({ status: input.reason })
    .eq('id', input.bagId);

  if (error) {
    return { success: false, notifiedCount: notifyResult.notifiedCount, error: error.message };
  }

  return notifyResult;
}

/**
 * Partner My Bags → Delete:
 * - Cancels active reservations + notifies customers
 * - Soft-cancel bag (status=cancelled) so it leaves customer home
 * - Hard-delete only when the bag never had orders (no FK)
 */
export async function deletePartnerBagListing(input: {
  bagId: string;
  partnerName: string;
}): Promise<DeletePartnerBagResult> {
  const { bagId, partnerName } = input;

  const notifyResult = await cancelBagWithCustomerNotification({
    bagId,
    reason: 'deleted',
    partnerName,
  });

  if (!notifyResult.success) {
    return { ok: false, reason: 'error', message: notifyResult.error || 'Could not cancel reservations' };
  }

  const { count: totalOrderCount, error: countError } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('bag_id', bagId);

  if (countError) {
    return { ok: false, reason: 'error', message: countError.message };
  }

  const { error: cancelBagError } = await supabase
    .from('rescue_bags')
    .update({ status: 'cancelled' })
    .eq('id', bagId);

  if (cancelBagError) {
    return { ok: false, reason: 'error', message: cancelBagError.message };
  }

  if ((totalOrderCount ?? 0) === 0 && notifyResult.notifiedCount === 0) {
    const { error: deleteError } = await supabase.from('rescue_bags').delete().eq('id', bagId);
    if (!deleteError) {
      return {
        ok: true,
        mode: 'hard_deleted',
        cancelledOrders: 0,
        notifiedCount: 0,
      };
    }
  }

  return {
    ok: true,
    mode: 'soft_cancelled',
    cancelledOrders: notifyResult.notifiedCount,
    notifiedCount: notifyResult.notifiedCount,
  };
}

