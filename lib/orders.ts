import { supabase } from '@/lib/supabase';
import type { CustomerOrderWithDetails, PartnerOrderWithCustomer } from '@/types/app';

const ORDER_SELECT = `
  *,
  partner:partners(*),
  bag:rescue_bags(*),
  review:reviews(*)
`;

export async function fetchCustomerOrders(userId: string) {
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
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      bag:rescue_bags(*),
      customer:profiles(id, full_name, phone)
    `)
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as PartnerOrderWithCustomer[]).filter(
    (order) => order.bag?.available_date === today,
  );
}

export async function fetchOrderByQrCode(qrCode: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      bag:rescue_bags(*),
      customer:profiles(id, full_name, phone)
    `)
    .eq('qr_code', qrCode)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as PartnerOrderWithCustomer | null;
}

export async function markOrderPickedUp(orderId: string) {
  return supabase
    .from('orders')
    .update({
      status: 'picked_up',
      picked_up_at: new Date().toISOString(),
    })
    .eq('id', orderId);
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
