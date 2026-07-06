import { formatRsPaisa, getTodayIsoDateLocal, parsePickupDateTimeLocal } from '@/lib/helpers';
import { isConfirmedOrderStatus, isReservedOrderStatus } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';
import type { Order, Profile } from '@/types/database';

export type PartnerBagOrder = Order & {
  customer: Pick<Profile, 'id' | 'full_name' | 'phone'>;
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

function reservedQuantityForBag(
  bagId: string,
  orderRows: Array<{ bag_id: string; status: string; quantity?: number }>,
) {
  return orderRows
    .filter((order) => order.bag_id === bagId && isReservedOrderStatus(order.status))
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
    const reservedQty = reservedQuantityForBag(bag.id, orderRows);
    return {
      ...bag,
      ...orderStatsForBag(bag.id, orderRows),
      quantity_reserved: Math.max(bag.quantity_reserved ?? 0, reservedQty),
    };
  });
}

export async function fetchPartnerBagsForDate(partnerId: string, date: string) {
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

export async function fetchPartnerBagOrders(bagId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:profiles(id, full_name, phone)
    `)
    .eq('bag_id', bagId)
    .in('status', ['confirmed', 'picked_up', 'pending'])
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
    | 'pickup_start'
    | 'pickup_end'
    | 'image_url'
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
    pickup_start: bag.pickup_start,
    pickup_end: bag.pickup_end,
    image_url: bag.image_url,
  };
}

export function computeTodaySummary(bags: PartnerBagWithStats[]) {
  const listed = bags.length;
  const reserved = bags.reduce((sum, bag) => sum + Math.max(0, bag.quantity_reserved), 0);
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
