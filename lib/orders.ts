import { sendNotification } from '@/lib/sendNotification';
import { supabase } from '@/lib/supabase';
import {
  CANCELLATION_BLOCKED_MESSAGE,
  getCancellationEligibility,
} from '@/constants/cancellation';
import {
  isPartnerPickupEligibleDbStatus,
  isReservedOrderStatus,
  isRevenueOrderStatus,
  normalizeOrderStatus,
  PARTNER_PICKUP_ELIGIBLE_ENUM_STATUSES,
} from '@/lib/orderStatus';
import {
  getOutsidePickupWindowCopy,
  getPickupWindowPhase,
  type PickupWindowPhase,
} from '@/lib/pickupWindow';
import type { CustomerOrderWithDetails, PartnerOrderWithCustomer } from '@/types/app';

const ORDER_SELECT = `
  *,
  partner:partners(*),
  bag:rescue_bags(*),
  review:reviews(*)
`;

/** Mark no-shows after pickup_end and expire closed bags (Nepal time). Safe to call often. */
export async function reconcileMissedOrders() {
  const { error } = await (
    supabase as unknown as {
      rpc: (fn: string) => Promise<{ error: { message: string } | null }>;
    }
  ).rpc('mark_missed_orders_after_pickup');
  if (error) throw error;
}

async function reconcileMissedOrdersQuietly() {
  try {
    await reconcileMissedOrders();
  } catch {
    // Cron / next open will catch up if RPC is unavailable.
  }
}

export async function fetchCustomerOrders(userId: string) {
  await reconcileMissedOrdersQuietly();

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const order = row as unknown as CustomerOrderWithDetails & { review: CustomerOrderWithDetails['review'][] | CustomerOrderWithDetails['review'] };
    const review = Array.isArray(order.review) ? order.review[0] ?? null : order.review;
    return { ...order, review };
  });
}

export async function fetchPartnerOrders(partnerId: string, today: string) {
  await reconcileMissedOrdersQuietly();

  const [{ data, error }, { data: todayBags }] = await Promise.all([
    supabase
    .from('orders')
      .select(`
      *,
      bag:rescue_bags(*),
      customer:profiles(id, full_name, phone, privacy_settings)
    `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('rescue_bags')
      .select('id')      .eq('partner_id', partnerId)
      .eq('available_date', today),
  ]);

  if (error) throw error;

  const todayBagIds = new Set((todayBags ?? []).map((bag) => bag.id));

  return ((data ?? []) as unknown as PartnerOrderWithCustomer[]).filter(
    (order) =>
      order.bag?.available_date === today ||
      todayBagIds.has(order.bag_id),
  );
}

export async function fetchOrderByManualCode(code: string, partnerId: string) {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      bag:rescue_bags(*),
      customer:profiles(id, full_name, phone, privacy_settings)
    `)
    .eq('partner_id', partnerId);

  if (error) throw error;

  const rows = (data ?? []) as unknown as PartnerOrderWithCustomer[];
  return (
    rows.find(
      (order) =>
        order.qr_code.toLowerCase() === normalized ||
        order.qr_code.replace(/-/g, '').toLowerCase().endsWith(normalized) ||
        order.qr_code.toLowerCase().startsWith(normalized),
    ) ?? null
  );
}

export async function fetchPartnerBags(partnerId: string, today: string) {
  const { data, error } = await supabase
    .from('rescue_bags')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('available_date', today)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchPartnerReviews(partnerId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      customer:profiles(id, full_name, phone, privacy_settings),
      order:orders(bag:rescue_bags(title))
    `)
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchPartnerStats(partnerId: string) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_price, status')
    .eq('partner_id', partnerId);

  if (error) throw error;

  const list = (orders ?? []).filter((order) => isRevenueOrderStatus(order.status));
  const revenue = list.reduce((sum, order) => sum + order.total_price, 0);
  return {
    bagsSold: list.length,
    totalRevenue: revenue,
    foodRescuedKg: Math.round((revenue / 100 / 100) * 0.5 * 10) / 10,
  };
}

export async function fetchPartnerBagsBefore(partnerId: string, beforeDate: string) {
  const { data, error } = await supabase
    .from('rescue_bags')
    .select('*')
    .eq('partner_id', partnerId)
    .lt('available_date', beforeDate)
    .order('available_date', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

function isLocalIsoDate(iso: string, date: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}` === date;
}

export async function fetchPartnerDayStats(partnerId: string, date: string) {
  const [{ data: bags }, { data: orders }] = await Promise.all([
    supabase
      .from('rescue_bags')
      .select('id, status, quantity_reserved')
      .eq('partner_id', partnerId)
      .eq('available_date', date),
    supabase
      .from('orders')
      .select('bag_id, total_price, status, quantity, created_at, picked_up_at')
      .eq('partner_id', partnerId),
  ]);

  const bagList = bags ?? [];
  const allOrders = orders ?? [];
  const todayBagIds = new Set(bagList.map((bag) => bag.id));

  // Awaiting pickup = still pending/confirmed for today's bags.
  // Do NOT use quantity_reserved — that includes picked_up (capacity occupied).
  const awaitingPickup = allOrders.filter(
    (order) => todayBagIds.has(order.bag_id) && isReservedOrderStatus(order.status),
  );
  const pickedUpToday = allOrders.filter(
    (order) =>
      order.status === 'picked_up' &&
      order.picked_up_at &&
      isLocalIsoDate(order.picked_up_at, date),
  );

  const bagsListed = bagList.filter(
    (bag) => bag.status === 'active' || bag.status === 'sold_out',
  ).length;
  const reserved = awaitingPickup.reduce((sum, order) => sum + (order.quantity ?? 1), 0);
  const pickedUp = pickedUpToday.reduce((sum, order) => sum + (order.quantity ?? 1), 0);
  const revenue = pickedUpToday.reduce((sum, order) => sum + (order.total_price || 0), 0);

  return {
    bagsListed,
    reserved,
    pickedUp,
    revenue,
  };
}

export async function fetchOrderByQrCode(qrCode: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      bag:rescue_bags(*),
      customer:profiles(id, full_name, phone, privacy_settings)
    `)
    .eq('qr_code', qrCode)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as PartnerOrderWithCustomer | null;
}

const PARTNER_ORDER_SELECT = `
  *,
  bag:rescue_bags(*),
  customer:profiles(id, full_name, phone, privacy_settings)
`;

export async function lookupOrderByPartnerCode(code: string, partnerId: string) {
  const trimmed = code.trim();
  if (!trimmed || !partnerId) return null;

  const fullUuidOrder = await fetchOrderByQrCode(trimmed);
  if (fullUuidOrder?.partner_id === partnerId) {
    return fullUuidOrder;
  }

  const prefix = trimmed.replace(/-/g, '').slice(0, 6).toLowerCase();
  if (prefix.length < 6) return null;

  const { data, error } = await supabase
    .from('orders')
    .select(PARTNER_ORDER_SELECT)
    .eq('partner_id', partnerId)
    .eq('status', 'confirmed')
    .ilike('qr_code', `${prefix}%`)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as PartnerOrderWithCustomer | null;
}

export type PickupConfirmedBy = 'partner_qr' | 'partner_manual';

export async function markOrderPickedUp(
  orderId: string,
  confirmedBy: PickupConfirmedBy = 'partner_qr',
) {
  const result = await supabase
    .from('orders')
    .update({
      status: 'picked_up',
      picked_up_at: new Date().toISOString(),
      confirmed_by: confirmedBy,
    } as never)
    .eq('id', orderId)
    .in('status', [...PARTNER_PICKUP_ELIGIBLE_ENUM_STATUSES])
    .select('id, status, picked_up_at')
    .maybeSingle();

  if (result.error) {
    console.error('Failed to update order:', result.error);
    return { ...result, didUpdate: false };
  }

  if (result.data) {
    console.log('Order marked as picked up:', orderId, confirmedBy);
    return { ...result, didUpdate: true };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, picked_up_at')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: fetchError, didUpdate: false };
  }

  if (existing?.status === 'picked_up') {
    return { data: existing, error: null, didUpdate: false };
  }

  if (existing && isPartnerPickupEligibleDbStatus(existing.status)) {
    console.warn(
      '[markOrderPickedUp] update blocked — partner may lack UPDATE policy on orders',
      orderId,
      existing.status,
    );
    return {
      data: null,
      error: {
        message:
          'Could not confirm pickup. Ask your admin to run migration 028_partner_confirm_pickup.sql.',
      } as typeof result.error,
      didUpdate: false,
    };
  }

  return {
    data: null,
    error: { message: 'Order not found or not in confirmed status' } as typeof result.error,
    didUpdate: false,
  };
}

export async function notifyCustomerPickupConfirmed(
  order: PickupNotifyOrder,
  partnerName?: string,
) {
  const restaurant = partnerName ?? 'the restaurant';
  const bagTitle = order.bag?.title ?? 'your rescue bag';

  await sendNotification({
    userId: order.customer_id,
    title: 'Pickup confirmed! 🎉',
    body: `Enjoy ${bagTitle} from ${restaurant}! Leave a review to help others.`,
    type: 'pickup_confirmed',
    data: {
      order_id: order.id,
      orderId: order.id,
      type: 'pickup_confirmed',
    },
  });

  // Immediate review prompt — opens My Bags review sheet on tap
  await sendNotification({
    userId: order.customer_id,
    title: 'How was your rescue bag? 🛍',
    body: `Rate your experience at ${restaurant}`,
    type: 'review_request',
    data: {
      order_id: order.id,
      orderId: order.id,
      partner_id: order.partner_id,
      partner_name: restaurant,
      type: 'review_request',
    },
  });
}

type PickupNotifyOrder = {
  id: string;
  customer_id: string;
  partner_id: string;
  bag?: { title: string };
};

export type ConfirmPartnerPickupResult = {
  ok: boolean;
  alreadyPickedUp?: boolean;
  errorMessage?: string;
  /** Outside the bag’s pickup window — partner must explicitly override. */
  needsOverride?: boolean;
  phase?: Exclude<PickupWindowPhase, 'open'>;
  overrideTitle?: string;
  overrideBody?: string;
  overrideConfirmLabel?: string;
};

export type ConfirmPartnerPickupOptions = {
  /** Set true after the partner acknowledges early/late pickup. */
  allowOutsideWindow?: boolean;
};

export async function confirmPartnerPickup(
  order: PartnerOrderWithCustomer,
  confirmedBy: PickupConfirmedBy,
  partnerName?: string,
  options?: ConfirmPartnerPickupOptions,
): Promise<ConfirmPartnerPickupResult> {
  if (normalizeOrderStatus(order.status) === 'picked_up') {
    return { ok: true, alreadyPickedUp: true };
  }

  const bag = order.bag;
  if (bag?.available_date && bag.pickup_start && bag.pickup_end) {
    const phase = getPickupWindowPhase(bag.available_date, bag.pickup_start, bag.pickup_end);
    if (phase !== 'open' && !options?.allowOutsideWindow) {
      const copy = getOutsidePickupWindowCopy(phase, bag.pickup_start, bag.pickup_end);
      return {
        ok: false,
        needsOverride: true,
        phase,
        overrideTitle: copy.title,
        overrideBody: copy.body,
        overrideConfirmLabel: copy.confirmLabel,
      };
    }
  }

  const result = await markOrderPickedUp(order.id, confirmedBy);
  if (result.error) {
    return { ok: false, errorMessage: result.error.message };
  }

  if (!result.data) {
    return { ok: false, errorMessage: 'Order not found or not in confirmed status' };
  }

  if (result.didUpdate) {
    await notifyCustomerPickupConfirmed(order, partnerName);
    return { ok: true };
  }

  return { ok: true, alreadyPickedUp: true };
}

export async function cancelReservation(orderId: string, reason?: string | null) {
  const { data: orderRow, error: fetchError } = await supabase
    .from('orders')
    .select(`
      *,
      bag:rescue_bags(*),
      partner:partners(user_id, name)
    `)
    .eq('id', orderId)
    .single();

  if (fetchError || !orderRow) {
    return { error: fetchError ?? new Error('Order not found'), bagReactivated: false, bagId: null };
  }

  const order = orderRow as unknown as CustomerOrderWithDetails & {
    partner: { user_id: string; name: string };
  };

  if (order.status === 'cancelled') {
    return { error: null, bagReactivated: false, bagId: order.bag_id };
  }

  if (order.status === 'picked_up') {
    return { error: new Error('This bag was already picked up'), bagReactivated: false, bagId: order.bag_id };
  }

  const eligibility = getCancellationEligibility(
    order.bag.available_date,
    order.bag.pickup_start,
    order.bag.pickup_end,
  );

  if (eligibility === 'blocked' || eligibility === 'expired') {
    return {
      error: new Error(CANCELLATION_BLOCKED_MESSAGE),
      bagReactivated: false,
      bagId: order.bag_id,
    };
  }

  const bag = order.bag;
  const wasSoldOut = bag.status === 'sold_out';
  const nextReserved = Math.max(0, bag.quantity_reserved - order.quantity);
  const shouldReactivate = wasSoldOut && nextReserved < bag.quantity_available;

  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancellation_reason: reason?.trim() || null,
      cancelled_at: new Date().toISOString(),
    } as never)
    .eq('id', orderId)
    .in('status', ['pending', 'confirmed']);

  if (orderError) {
    return { error: orderError, bagReactivated: false, bagId: order.bag_id };
  }

  // Trigger syncs quantity_reserved + sold_out → active. Refresh bag for client stock.
  const { data: refreshedBag } = await supabase
    .from('rescue_bags')
    .select('id, quantity_reserved, quantity_available, status')
    .eq('id', order.bag_id)
    .maybeSingle();

  if (order.partner.user_id) {
    const customerName = order.customer_name?.trim() || 'A customer';
    await sendNotification({
      userId: order.partner.user_id,
      title: 'Customer cancelled',
      body: `${customerName} cancelled their ${bag.title} reservation. Slot is now free.`,
      type: 'cancellation',
      data: {
        order_id: orderId,
        bag_id: order.bag_id,
        orderId,
        bagId: order.bag_id,
        type: 'partner_dashboard',
      },
    });
  }

  await sendNotification({
    userId: order.customer_id,
    title: 'Reservation cancelled',
    body: `Your ${bag.title} reservation has been cancelled. The slot is now free for others.`,
    type: 'cancellation',
    data: {
      order_id: orderId,
      bag_id: order.bag_id,
      orderId,
      bagId: order.bag_id,
      type: 'cancellation',
    },
  });

  return {
    error: null,
    bagReactivated: shouldReactivate || (refreshedBag?.status === 'active' && wasSoldOut),
    bagId: order.bag_id,
    bagStock: refreshedBag
      ? {
          quantity_reserved: refreshedBag.quantity_reserved,
          quantity_available: refreshedBag.quantity_available,
          status: refreshedBag.status,
        }
      : {
          quantity_reserved: nextReserved,
          quantity_available: bag.quantity_available,
          status: shouldReactivate ? ('active' as const) : bag.status,
        },
  };
}

/**
 * Reduce reserved quantity without cancelling the whole order (e.g. 2 → 1).
 * Requires migration 049 so quantity updates sync bag stock.
 */
export async function reduceReservationQuantity(
  orderId: string,
  newQuantity: number,
  reason?: string | null,
) {
  const { data: orderRow, error: fetchError } = await supabase
    .from('orders')
    .select(`
      *,
      bag:rescue_bags(*),
      partner:partners(user_id, name)
    `)
    .eq('id', orderId)
    .single();

  if (fetchError || !orderRow) {
    return { error: fetchError ?? new Error('Order not found'), bagId: null, bagStock: null, order: null };
  }

  const order = orderRow as unknown as CustomerOrderWithDetails & {
    partner: { user_id: string; name: string };
  };

  if (order.status === 'cancelled' || order.status === 'picked_up' || order.status === 'missed') {
    return {
      error: new Error('This reservation can no longer be changed'),
      bagId: order.bag_id,
      bagStock: null,
      order: null,
    };
  }

  if (!Number.isInteger(newQuantity) || newQuantity < 1 || newQuantity >= order.quantity) {
    return {
      error: new Error('Choose a quantity lower than your current reservation'),
      bagId: order.bag_id,
      bagStock: null,
      order: null,
    };
  }

  const eligibility = getCancellationEligibility(
    order.bag.available_date,
    order.bag.pickup_start,
    order.bag.pickup_end,
  );

  if (eligibility === 'blocked' || eligibility === 'expired') {
    return {
      error: new Error(CANCELLATION_BLOCKED_MESSAGE),
      bagId: order.bag_id,
      bagStock: null,
      order: null,
    };
  }

  const unitPrice = Math.round(order.total_price / order.quantity);
  const cancelledQty = order.quantity - newQuantity;
  const nextTotal = unitPrice * newQuantity;
  const wasSoldOut = order.bag.status === 'sold_out';

  const { data: updatedRow, error: updateError } = await supabase
    .from('orders')
    .update({
      quantity: newQuantity,
      total_price: nextTotal,
      cancellation_reason: reason?.trim()
        ? `Reduced by ${cancelledQty}: ${reason.trim()}`
        : `Reduced by ${cancelledQty}`,
    } as never)
    .eq('id', orderId)
    .in('status', ['pending', 'confirmed'])
    .select(`
      *,
      bag:rescue_bags(*),
      partner:partners(*),
      review:reviews(*)
    `)
    .maybeSingle();

  if (updateError || !updatedRow) {
    return {
      error: updateError ?? new Error('Could not update quantity'),
      bagId: order.bag_id,
      bagStock: null,
      order: null,
    };
  }

  // Ensure reserved stock drops even if the quantity trigger isn't applied yet.
  try {
    await supabase.rpc('sync_rescue_bag_reserved_quantity' as never, {
      target_bag_id: order.bag_id,
    } as never);
  } catch {
    // Trigger / column refresh below still used as fallback.
  }

  const { data: refreshedBag } = await supabase
    .from('rescue_bags')
    .select('id, quantity_reserved, quantity_available, status')
    .eq('id', order.bag_id)
    .maybeSingle();

  const fallbackReserved = Math.max(0, order.bag.quantity_reserved - cancelledQty);
  const bagStock = refreshedBag
    ? {
        quantity_reserved: refreshedBag.quantity_reserved,
        quantity_available: refreshedBag.quantity_available,
        status: refreshedBag.status as typeof order.bag.status,
      }
    : {
        quantity_reserved: fallbackReserved,
        quantity_available: order.bag.quantity_available,
        status:
          wasSoldOut && fallbackReserved < order.bag.quantity_available
            ? ('active' as const)
            : order.bag.status,
      };

  if (order.partner.user_id) {
    const customerName = order.customer_name?.trim() || 'A customer';
    await sendNotification({
      userId: order.partner.user_id,
      title: 'Customer reduced quantity',
      body: `${customerName} cancelled ${cancelledQty} of ${order.quantity} on ${order.bag.title}. Slot(s) freed.`,
      type: 'cancellation',
      data: {
        order_id: orderId,
        bag_id: order.bag_id,
        orderId,
        bagId: order.bag_id,
        type: 'partner_dashboard',
      },
    });
  }

  const updated = updatedRow as unknown as CustomerOrderWithDetails & {
    review: CustomerOrderWithDetails['review'][] | CustomerOrderWithDetails['review'];
  };
  const review = Array.isArray(updated.review) ? updated.review[0] ?? null : updated.review;

  return {
    error: null,
    bagId: order.bag_id,
    bagReactivated: Boolean(wasSoldOut && bagStock.status === 'active'),
    bagStock,
    order: { ...updated, review } as CustomerOrderWithDetails,
  };
}

export async function submitReview(input: {
  orderId: string;
  customerId: string;
  partnerId: string;
  rating: number;
  comment?: string;
}) {
  return supabase.from('reviews').insert({
    order_id: input.orderId,
    customer_id: input.customerId,
    partner_id: input.partnerId,
    rating: input.rating,
    comment: input.comment?.trim() || null,
  });
}
