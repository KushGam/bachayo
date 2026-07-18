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
  const { error } = await supabase
    .from('order_messages')
    .update({ is_read: true })
    .eq('order_id', orderId)
    .neq('sender_id', currentUserId)
    .eq('is_read', false);
  if (error) {
    console.warn('[orderMessages] mark read failed:', error.message);
  }
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

/** Unread messages only on active reservations (keeps tab badge meaningful). */
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

export type MessageThread = {
  orderId: string;
  status: string;
  bagTitle: string;
  counterpartName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

/** Active order chats for the current user (customer and/or partner). */
export async function fetchMessageThreads(currentUserId: string): Promise<MessageThread[]> {
  const { data: asPartner } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', currentUserId)
    .maybeSingle();

  const activeStatuses = ['pending', 'confirmed'] as const;

  const { data: customerOrders, error: customerError } = await supabase
    .from('orders')
    .select('id, status, bag:rescue_bags(title), partner:partners(name)')
    .eq('customer_id', currentUserId)
    .in('status', [...activeStatuses]);
  if (customerError) throw customerError;

  const { data: partnerOrders, error: partnerError } = asPartner
    ? await supabase
        .from('orders')
        .select('id, status, bag:rescue_bags(title), customer:profiles!customer_id(full_name)')
        .eq('partner_id', asPartner.id)
        .in('status', [...activeStatuses])
    : { data: null, error: null };
  if (partnerError) throw partnerError;

  type Seed = {
    orderId: string;
    status: string;
    bagTitle: string;
    counterpartName: string;
  };

  const seeds: Seed[] = [];
  const seen = new Set<string>();

  for (const row of customerOrders ?? []) {
    const bag = row.bag as { title: string } | null;
    const partner = row.partner as { name: string } | null;
    seen.add(row.id);
    seeds.push({
      orderId: row.id,
      status: row.status,
      bagTitle: bag?.title?.trim() || 'Rescue bag',
      counterpartName: partner?.name?.trim() || 'Partner',
    });
  }

  for (const row of partnerOrders ?? []) {
    if (seen.has(row.id)) continue;
    const bag = row.bag as { title: string } | null;
    const customer = row.customer as { full_name: string | null } | null;
    seeds.push({
      orderId: row.id,
      status: row.status,
      bagTitle: bag?.title?.trim() || 'Rescue bag',
      counterpartName: customer?.full_name?.trim() || 'Customer',
    });
  }

  if (seeds.length === 0) return [];

  const orderIds = seeds.map((s) => s.orderId);
  const unreadByOrder = await fetchUnreadCountsByOrder(orderIds, currentUserId);

  const { data: recentMessages } = await supabase
    .from('order_messages')
    .select('order_id, message, created_at')
    .in('order_id', orderIds)
    .order('created_at', { ascending: false });

  const lastByOrder = new Map<string, { message: string; created_at: string }>();
  for (const row of recentMessages ?? []) {
    const id = row.order_id as string;
    if (!lastByOrder.has(id)) {
      lastByOrder.set(id, {
        message: row.message as string,
        created_at: row.created_at as string,
      });
    }
  }

  const threads: MessageThread[] = seeds.map((seed) => {
    const last = lastByOrder.get(seed.orderId) ?? null;
    return {
      orderId: seed.orderId,
      status: seed.status,
      bagTitle: seed.bagTitle,
      counterpartName: seed.counterpartName,
      lastMessage: last?.message ?? null,
      lastMessageAt: last?.created_at ?? null,
      unreadCount: unreadByOrder[seed.orderId] ?? 0,
    };
  });

  threads.sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
    const aTime = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
    const bTime = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
    return bTime - aTime;
  });

  return threads;
}
