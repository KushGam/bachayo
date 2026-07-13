import { getBagDineInExtraPaisa, getBagServiceType } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import { useBagsStore } from '@/store/useBagsStore';
import {
  NEW_RESERVATION_APP_STATUS,
  NEW_RESERVATION_DB_STATUS,
} from '@/lib/orderStatus';
import type { RescueBagWithPartner } from '@/types/app';

/** Statuses that count as an active reservation (enum-safe for Supabase filters). */
export const ACTIVE_RESERVATION_STATUSES = ['confirmed', 'pending'] as const;

export type ActiveReservation = {
  id: string;
  status: string;
};

export async function findActiveReservationForBag(
  customerId: string,
  bagId: string,
): Promise<ActiveReservation | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status')
    .eq('customer_id', customerId)
    .eq('bag_id', bagId)
    .in('status', [...ACTIVE_RESERVATION_STATUSES])
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function fetchActiveReservedBagIds(customerId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('orders')
    .select('bag_id')
    .eq('customer_id', customerId)
    .in('status', [...ACTIVE_RESERVATION_STATUSES]);

  if (error) return new Set();
  return new Set((data ?? []).map((row) => row.bag_id));
}

export type CreateReservationInput = {
  bagId: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerNote?: string;
  serviceType?: 'takeaway' | 'dinein';
};

export type CreateReservationResult =
  | { ok: true; orderId: string }
  | {
      ok: false;
      error: 'sold_out' | 'auth' | 'profile' | 'duplicate' | 'network';
      message?: string;
      orderId?: string;
    };

function isSoldOutError(message?: string | null) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('bag_sold_out') || lower.includes('sold out');
}

function isDuplicateReservationError(message?: string | null, code?: string | null) {
  if (code === '23505') return true;
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('unique_active_reservation') || lower.includes('duplicate');
}

function mapOrderInsertError(
  message?: string | null,
  code?: string | null,
): CreateReservationResult {
  if (isDuplicateReservationError(message, code)) {
    return {
      ok: false,
      error: 'duplicate',
      message: 'You already have an active reservation for this bag.',
    };
  }
  if (isSoldOutError(message)) {
    return { ok: false, error: 'sold_out' };
  }
  if (message?.includes('profiles') || message?.includes('customer_id')) {
    return {
      ok: false,
      error: 'profile',
      message: 'Please complete your profile before reserving.',
    };
  }
  return { ok: false, error: 'network', message: message ?? 'Could not create reservation' };
}

function randomUuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function formatPickupWindow(pickupStart: string, pickupEnd: string) {
  const fmt = (time: string) => {
    const [h, m] = time.slice(0, 5).split(':').map(Number);
    const period = h >= 12 ? 'pm' : 'am';
    const hour12 = h % 12 || 12;
    return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, '0')}${period}`;
  };
  return `${fmt(pickupStart)}–${fmt(pickupEnd)}`;
}

export async function notifyPartnerReservation(input: {
  partnerUserId: string;
  partnerId: string;
  bagId: string;
  customerName: string;
  quantity: number;
  bagTitle: string;
  pickupStart: string;
  pickupEnd: string;
}) {
  const pickup = formatPickupWindow(input.pickupStart, input.pickupEnd);
  const qtyLabel = input.quantity === 1 ? '' : `${input.quantity}× `;

  await supabase.functions.invoke('send-notification', {
    body: {
      user_id: input.partnerUserId,
      title: 'New reservation! 🎉',
      body: `${input.customerName} reserved ${qtyLabel}${input.bagTitle}. Pickup ${pickup} · Pay at counter`,
      type: 'reservation',
      data: {
        bag_id: input.bagId,
        partner_id: input.partnerId,
        bagId: input.bagId,
        type: 'partner_dashboard',
      },
    },
  });
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    return { ok: false, error: 'auth', message: 'Please sign in first' };
  }

  const { data: bagRow, error: bagError } = await supabase
    .from('rescue_bags')
    .select('*, partner:partners(*)')
    .eq('id', input.bagId)
    .eq('status', 'active')
    .maybeSingle();

  if (bagError || !bagRow) {
    return { ok: false, error: 'network', message: bagError?.message ?? 'Bag not found' };
  }

  const bag = bagRow as unknown as RescueBagWithPartner;
  const remaining = bag.quantity_available - bag.quantity_reserved;
  if (remaining < input.quantity) {
    return { ok: false, error: 'sold_out' };
  }

  const existing = await findActiveReservationForBag(userId, input.bagId);
  if (existing) {
    return {
      ok: false,
      error: 'duplicate',
      orderId: existing.id,
      message: 'You already have an active reservation for this bag.',
    };
  }

  const bagServiceType = getBagServiceType(bag);
  const dineInExtra = getBagDineInExtraPaisa(bag);
  const chosenServiceType: 'takeaway' | 'dinein' =
    bagServiceType === 'dinein'
      ? 'dinein'
      : bagServiceType === 'takeaway'
        ? 'takeaway'
        : (input.serviceType ?? 'takeaway');
  const unitPrice = chosenServiceType === 'dinein' ? bag.rescue_price + dineInExtra : bag.rescue_price;
  const totalPrice = unitPrice * input.quantity;
  const qrCode = randomUuidV4();

  const insertPayload = {
    customer_id: userId,
    bag_id: bag.id,
    partner_id: bag.partner_id,
    quantity: input.quantity,
    total_price: totalPrice,
    qr_code: qrCode,
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone.trim(),
    customer_note: input.customerNote?.trim() || null,
    service_type: chosenServiceType,
  };

  let { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ ...insertPayload, status: NEW_RESERVATION_APP_STATUS })
    .select('id')
    .single();

  if (orderError?.code === '22P02') {
    ({ data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ ...insertPayload, status: NEW_RESERVATION_DB_STATUS })
      .select('id')
      .single());
  }

  if (orderError || !order) {
    return mapOrderInsertError(orderError?.message, orderError?.code);
  }

  useBagsStore.getState().incrementBagReserved(bag.id, input.quantity);

  if (bag.partner.user_id) {
    try {
      await notifyPartnerReservation({
        partnerUserId: bag.partner.user_id,
        partnerId: bag.partner_id,
        bagId: bag.id,
        customerName: input.customerName.trim(),
        quantity: input.quantity,
        bagTitle: bag.title,
        pickupStart: bag.pickup_start,
        pickupEnd: bag.pickup_end,
      });
    } catch (notifyError) {
      console.warn('[reservations] partner notification failed:', notifyError);
    }
  }

  return { ok: true, orderId: order.id };
}
