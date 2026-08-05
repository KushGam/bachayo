import { supabase } from '@/lib/supabase';

export type InboxNotificationType =
  | 'reservation'
  | 'cancellation'
  | 'pickup_reminder'
  | 'review_request'
  | 'new_review'
  | 'bag_expiring'
  | 'subscription'
  | 'new_bag'
  | 'system'
  | 'announcement';

export type InboxNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: InboxNotificationType;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

export async function fetchUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

export async function fetchNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as InboxNotification[];
}

export async function fetchNotificationById(id: string, userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as InboxNotification | null) ?? null;
}

export async function markNotificationRead(id: string, userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true } as never)
    .eq('id', id)
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true } as never)
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

export async function deleteNotification(id: string, userId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function clearAllNotifications(userId: string) {
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId);

  if (error) throw error;
}

export type NotificationDateGroup = 'Today' | 'Yesterday' | 'This week' | 'Earlier';

export function getNotificationDateGroup(iso: string): NotificationDateGroup {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  if (date >= startOfWeek) return 'This week';
  return 'Earlier';
}

export function groupNotificationsByDate(notifications: InboxNotification[]) {
  const order: NotificationDateGroup[] = ['Today', 'Yesterday', 'This week', 'Earlier'];
  const groups = new Map<NotificationDateGroup, InboxNotification[]>();

  for (const notification of notifications) {
    const key = getNotificationDateGroup(notification.created_at);
    const list = groups.get(key) ?? [];
    list.push(notification);
    groups.set(key, list);
  }

  return order
    .filter((key) => groups.has(key))
    .map((title) => ({ title, data: groups.get(title)! }));
}
