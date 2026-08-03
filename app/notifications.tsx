import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import {
  Bell,
  ChevronLeft,
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
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
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

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Failed to load notifications';
}

function getNotificationIcon(type: InboxNotificationType) {
  switch (type) {
    case 'reservation':
      return { bg: '#ECFDF5', Icon: ShoppingBag, color: '#059669' };
    case 'cancellation':
      return { bg: '#FEF2F2', Icon: X, color: '#DC2626' };
    case 'pickup_reminder':
      return { bg: Palette.primaryLight, Icon: Clock, color: Palette.primary };
    case 'review_request':
      return { bg: '#FEF3C7', Icon: Star, color: '#D97706' };
    case 'new_review':
      return { bg: '#FEF3C7', Icon: Star, color: '#D97706' };
    case 'bag_expiring':
      return { bg: '#FEF3C7', Icon: Timer, color: '#D97706' };
    case 'subscription':
      return { bg: '#EDE9FE', Icon: Crown, color: '#7C3AED' };
    case 'new_bag':
      return { bg: Palette.primaryLight, Icon: Sparkles, color: Palette.primary };
    default:
      return { bg: '#F3F4F6', Icon: Info, color: '#6B7280' };
  }
}

function getNotificationRoute(notification: InboxNotification): Href {
  const data = notification.data ?? {};
  const orderId = String(data.order_id ?? data.orderId ?? '');
  const bagId = String(data.bag_id ?? data.bagId ?? '');
  const dataType = typeof data.type === 'string' ? data.type : '';
  const detail = `/notifications/${notification.id}` as Href;

  if (dataType === 'partner_dashboard') {
    return '/(tabs)/partner/dashboard' as Href;
  }

  switch (notification.type) {
    case 'reservation':
    case 'new_bag':
      return bagId ? (`/bag/${bagId}` as Href) : detail;
    case 'cancellation':
      return '/(tabs)/customer/my-bags' as Href;
    case 'pickup_reminder':
      return orderId ? (`/order/${orderId}` as Href) : detail;
    case 'review_request':
      return orderId
        ? (`/(tabs)/customer/my-bags?review=${orderId}` as Href)
        : ('/(tabs)/customer/my-bags' as Href);
    case 'new_review':
      return '/(tabs)/partner/reviews' as Href;
    case 'bag_expiring':
      return '/(tabs)/partner/my-bags' as Href;
    case 'subscription':
      return '/(tabs)/partner/subscription' as Href;
    case 'system':
    case 'announcement':
    default:
      return detail;
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
      style={({ pressed }) => [
        styles.row,
        !item.is_read && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
        <Icon size={18} color={icon.color} strokeWidth={2.2} />
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTitleRow}>
          <Text
            style={[styles.rowTitle, !item.is_read && styles.rowTitleUnread]}
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.rowTime}>{formatRelativeTime(item.created_at)}</Text>
        </View>
        <Text style={styles.rowBodyText} numberOfLines={2}>
          {item.body}
        </Text>
      </View>

      {!item.is_read ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function NotificationsEmpty({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconRing}>
          <View style={styles.emptyIconWrap}>
            <Bell size={28} color={Palette.primary} strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.emptyTitle}>You're all caught up</Text>
        <Text style={styles.emptySubtitle}>
          Reservations, pickup reminders, and bag alerts will show up here.
        </Text>

        <View style={styles.emptyHints}>
          <View style={styles.emptyHint}>
            <ShoppingBag size={14} color={Palette.primary} strokeWidth={2.2} />
            <Text style={styles.emptyHintText}>New reservations</Text>
          </View>
          <View style={styles.emptyHint}>
            <Clock size={14} color={Palette.primary} strokeWidth={2.2} />
            <Text style={styles.emptyHintText}>Pickup reminders</Text>
          </View>
          <View style={styles.emptyHint}>
            <Sparkles size={14} color={Palette.primary} strokeWidth={2.2} />
            <Text style={styles.emptyHintText}>Nearby bags</Text>
          </View>
        </View>

        <Pressable
          onPress={onBrowse}
          style={({ pressed }) => [styles.emptyCta, pressed && styles.rowPressed]}>
          <Text style={styles.emptyCtaText}>Find bags near me</Text>
        </Pressable>
      </View>
    </View>
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

  const markRead = useCallback(
    async (uid: string) => {
      await markAllNotificationsRead(uid);
      setUnreadNotifications(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    },
    [setUnreadNotifications],
  );

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
      if (rows.some((row) => !row.is_read)) {
        await markRead(uid);
      }
    } catch (err) {
      setErrorText(getErrorMessage(err));
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

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ChevronLeft size={22} color={Palette.white} strokeWidth={2.4} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unread > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unread}</Text>
              </View>
            ) : null}
          </View>

          {unread > 0 ? (
            <Pressable
              onPress={() => void handleMarkAllRead()}
              hitSlop={8}
              style={styles.markReadBtn}>
              <Text style={styles.markRead}>Mark read</Text>
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
        <NotificationsEmpty onBrowse={() => router.replace('/(tabs)/customer/home')} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: Spacing.md,
            paddingBottom: insets.bottom + 24,
          }}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={Palette.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => {
                router.push(getNotificationRoute(item));
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
    backgroundColor: Palette.background,
  },
  header: {
    backgroundColor: Palette.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    ...FloatingShadow,
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.white,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '700',
  },
  markReadBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  markRead: {
    fontSize: 12,
    color: Palette.white,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 36,
  },
  loadingWrap: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginLeft: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  row: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  rowUnread: {
    backgroundColor: '#FFFCF9',
    borderColor: Palette.primaryMid,
  },
  rowPressed: {
    opacity: 0.92,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowTitle: {
    ...Type.bodyMedium,
    flex: 1,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  rowTitleUnread: {
    fontWeight: '700',
  },
  rowBodyText: {
    ...Type.caption,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  rowTime: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.primary,
    marginTop: 6,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  emptyCard: {
    ...CardChrome,
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    ...FloatingShadow,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  emptyHints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.xl,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emptyHintText: {
    ...Type.label,
    color: Palette.primaryDark,
    fontWeight: '600',
  },
  emptyCta: {
    marginTop: Spacing.xl,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  emptyCtaText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '700',
  },
});
