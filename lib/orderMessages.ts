import { supabase } from '@/lib/supabase';

export type OrderMessage = {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: 'customer' | 'partner';
  message: string;
  is_read: boolean;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

export async function fetchOrderMessages(orderId: string) {
  const { data, error } = await supabase
    .from('order_messages')
    .select('*, profiles!sender_id(full_name, avatar_url)')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as OrderMessage[];
}

export async function markOrderMessagesRead(orderId: string, currentUserId: string) {
  await supabase
    .from('order_messages')
    .update({ is_read: true })
    .eq('order_id', orderId)
    .neq('sender_id', currentUserId);
}

export async function sendOrderMessage(input: {
  orderId: string;
  senderId: string;
  senderRole: 'customer' | 'partner';
  message: string;
}) {
  const { data, error } = await supabase
    .from('order_messages')
    .insert({
      order_id: input.orderId,
      sender_id: input.senderId,
      sender_role: input.senderRole,
      message: input.message,
    })
    .select()
    .single();
  if (error) throw error;
  return data as OrderMessage;
}

export async function fetchUnreadMessagesCountForOrders(orderIds: string[], currentUserId: string) {
  if (orderIds.length === 0) return 0;
  const { count, error } = await supabase
    .from('order_messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', currentUserId)
    .in('order_id', orderIds);
  if (error) return 0;
  return count ?? 0;
}

export async function fetchUnreadCountsByOrder(orderIds: string[], currentUserId: string) {
  if (orderIds.length === 0) return {} as Record<string, number>;
  const { data, error } = await supabase
    .from('order_messages')
    .select('order_id')
    .eq('is_read', false)
    .neq('sender_id', currentUserId)
    .in('order_id', orderIds);
  if (error || !data) return {};
  return data.reduce<Record<string, number>>((acc, row) => {
    const id = row.order_id as string;
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
}
