import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import {
  Clock,
  Crown,
  Info,
  ShoppingBag,
  Sparkles,
  Star,
  Timer,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/lib/helpers';
import {
  fetchNotifications,
  groupNotificationsByDate,
  markAllNotificationsRead,
  type InboxNotification,
  type InboxNotificationType,
} from '@/lib/notificationsInbox';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

const TERRACOTTA = '#D85A30';

function getNotificationIcon(type: InboxNotificationType) {
  switch (type) {
    case 'reservation':
      return { bg: '#ECFDF5', Icon: ShoppingBag, color: '#059669' };
    case 'cancellation':
      return { bg: '#FEF2F2', Icon: X, color: '#DC2626' };
    case 'pickup_reminder':
      return { bg: '#FAECE7', Icon: Clock, color: TERRACOTTA };
    case 'review_request':
      return { bg: '#FEF3C7', Icon: Star, color: '#D97706' };
    case 'bag_expiring':
      return { bg: '#FEF3C7', Icon: Timer, color: '#D97706' };
    case 'subscription':
      return { bg: '#EDE9FE', Icon: Crown, color: '#7C3AED' };
    case 'new_bag':
      return { bg: '#FAECE7', Icon: Sparkles, color: TERRACOTTA };
    default:
      return { bg: '#F3F4F6', Icon: Info, color: '#6B7280' };
  }
}

function getNotificationRoute(notification: InboxNotification): Href | null {
  const data = notification.data ?? {};
  const orderId = String(data.order_id ?? data.orderId ?? '');
  const bagId = String(data.bag_id ?? data.bagId ?? '');

  switch (notification.type) {
    case 'reservation':
    case 'new_bag':
      return bagId ? (`/bag/${bagId}` as Href) : null;
    case 'cancellation':
      return '/(tabs)/customer/my-bags' as Href;
    case 'pickup_reminder':
      return orderId ? (`/order/${orderId}` as Href) : null;
    case 'review_request':
      return orderId ? (`/review/${orderId}` as Href) : null;
    case 'bag_expiring':
      return '/(tabs)/partner/my-bags' as Href;
    case 'subscription':
      return '/(tabs)/partner/subscription' as Href;
    default:
      return null;
  }
}

function NotificationRow({
  item,
  onPress,
}: {
  item: InboxNotification;
  onPress: () => void;
}) {
  const icon = getNotificationIcon(item.type);
  const Icon = icon.Icon;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !item.is_read && styles.rowUnread]}>
      <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
        <Icon size={20} color={icon.color} strokeWidth={2} />
      </View>

      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, !item.is_read && styles.rowTitleUnread]}>{item.title}</Text>
        <Text style={styles.rowBodyText}>{item.body}</Text>
        <Text style={styles.rowTime}>{formatRelativeTime(item.created_at)}</Text>
      </View>

      {!item.is_read ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const unread = useAppStore((s) => s.unreadNotifications);
  const setUnreadNotifications = useAppStore((s) => s.setUnreadNotifications);

  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const markRead = useCallback(async (uid: string) => {
    await markAllNotificationsRead(uid);
    setUnreadNotifications(0);
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
  }, [setUnreadNotifications]);

  const loadNotifications = useCallback(async () => {
    setErrorText(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    setUserId(uid ?? null);

    if (!uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const rows = await fetchNotifications(uid);
      setNotifications(rows);
      await markRead(uid);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [markRead]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const sections = useMemo(() => groupNotificationsByDate(notifications), [notifications]);

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await markRead(userId);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unread > 0 ? (
            <Pressable onPress={() => void handleMarkAllRead()} hitSlop={8}>
              <Text style={styles.markRead}>Mark all read</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ListSkeleton count={5} />
        </View>
      ) : errorText ? (
        <View style={styles.loadingWrap}>
          <RetryState message={errorText} onRetry={() => void loadNotifications()} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyCircle}>
            <Text style={styles.emptyEmoji}>🔔</Text>
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            We&apos;ll notify you about reservations,{'\n'}pickup reminders, and more
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={TERRACOTTA} />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => {
                const route = getNotificationRoute(item);
                if (route) router.push(route);
              }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  header: {
    backgroundColor: TERRACOTTA,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 24,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markRead: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSpacer: {
    width: 72,
  },
  loadingWrap: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowUnread: {
    backgroundColor: '#FAFAF8',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  rowTitleUnread: {
    fontWeight: '700',
  },
  rowBodyText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 2,
  },
  rowTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TERRACOTTA,
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
