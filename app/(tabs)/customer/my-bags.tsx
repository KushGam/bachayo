import { AppSymbol } from '@/components/ui/AppSymbol';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ShoppingBag } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CancelReservationSheet } from '@/components/customer/CancelReservationSheet';
import { OrderShortCode } from '@/components/customer/OrderShortCode';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { getCancellationEligibility } from '@/constants/cancellation';
import { FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import {
  formatNprPaisa,
  getPickupCountdownLabel,
  getPickupMinutesRemaining,
  openMapsDirections,
} from '@/lib/helpers';
import { isReservedOrderStatus, isReviewEligibleOrderStatus, normalizeOrderStatus } from '@/lib/orderStatus';
import { cancelReservation, fetchCustomerOrders } from '@/lib/orders';
import { hapticSuccess } from '@/lib/haptics';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import type { CustomerOrderWithDetails } from '@/types/app';
import type { OrderStatus } from '@/types/database';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TabKey = 'active' | 'past';

const PAST_STATUSES: OrderStatus[] = ['picked_up', 'cancelled'];

function isActiveOrderStatus(status: string) {
  return isReservedOrderStatus(status);
}

function isPastOrderStatus(status: string) {
  const normalized = normalizeOrderStatus(status);
  return PAST_STATUSES.includes(normalized) || normalized === 'cancelled';
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed ✓';
    case 'picked_up':
      return 'Picked up ✓';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function statusColor(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return Palette.amber;
    case 'confirmed':
      return Palette.primary;
    case 'picked_up':
      return Palette.success;
    case 'cancelled':
      return Palette.textSecondary;
    default:
      return Palette.textSecondary;
  }
}

type MyBagsEmptyProps = {
  tab: TabKey;
  onFind: () => void;
};

function MyBagsEmpty({ tab, onFind }: MyBagsEmptyProps) {
  const isActive = tab === 'active';

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyEmoji}>{isActive ? '🛍' : '📦'}</Text>
      </View>

      <Text style={styles.emptyTitle}>{isActive ? 'No reservations yet' : 'No past orders'}</Text>

      <Text style={styles.emptySubtitle}>
        {isActive
          ? "When you reserve a rescue bag,\nit appears here with your QR code\nfor pickup."
          : 'Your completed pickups will\nshow up here.'}
      </Text>

      {isActive ? (
        <>
          <Pressable
            onPress={onFind}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#993C1D' : '#D85A30',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 999,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}>
            <Text style={styles.emptyCtaText}>Find rescue bags →</Text>
          </Pressable>

          <Text style={styles.emptyHint}>
            Restaurants list bags daily{'\n'}
            Check back at 6–8pm 🕐
          </Text>
        </>
      ) : null}
    </View>
  );
}

export default function MyBagsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('active');
  const [orders, setOrders] = useState<CustomerOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cancelOrder, setCancelOrder] = useState<CustomerOrderWithDetails | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [showCancelToast, setShowCancelToast] = useState(false);
  const [showPickupToast, setShowPickupToast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [, tick] = useState(0);
  const refreshOrdersRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const timer = setInterval(() => tick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const refreshOrders = useCallback(async () => {
    setFetchError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setCustomerId(null);
      setOrders([]);
      return;
    }

    setCustomerId(userId);

    try {
      const rows = await fetchCustomerOrders(userId);
      setOrders(rows);
    } catch (err) {
      setOrders([]);
      setFetchError(err instanceof Error ? err.message : 'Failed to load orders');
    }
  }, []);

  refreshOrdersRef.current = refreshOrders;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    await refreshOrders();
    setLoading(false);
  }, [refreshOrders]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshOrders();
    setIsRefreshing(false);
  }, [refreshOrders]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshOrdersRef.current();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!customerId) return;

    let cancelled = false;
    const channelName = `customer-orders-${customerId}`;

    void (async () => {
      try {
        await subscribePostgresChannel(
          supabase,
          channelName,
          [
            {
              event: 'UPDATE',
              table: 'orders',
              filter: `customer_id=eq.${customerId}`,
              callback: (payload) => {
                const updated = (payload as { new?: Partial<CustomerOrderWithDetails> }).new;
                if (!updated?.id) return;

                setOrders((prev) => {
                  const index = prev.findIndex((order) => order.id === updated.id);
                  if (index === -1) {
                    void refreshOrdersRef.current();
                    return prev;
                  }

                  return prev.map((order) =>
                    order.id === updated.id ? { ...order, ...updated } : order,
                  );
                });

                if (updated.status === 'picked_up') {
                  void hapticSuccess();
                  setShowPickupToast(true);
                }
              },
            },
            {
              event: 'INSERT',
              table: 'orders',
              filter: `customer_id=eq.${customerId}`,
              callback: () => {
                void refreshOrdersRef.current();
              },
            },
          ],
          () => cancelled,
        );
      } catch (error) {
        if (!cancelled) {
          console.warn('[my-bags] realtime subscribe failed:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      void removeChannelByName(supabase, channelName);
    };
  }, [customerId]);

  const activeOrders = useMemo(
    () => orders.filter((o) => isActiveOrderStatus(o.status)),
    [orders],
  );
  const pastOrders = useMemo(
    () => orders.filter((o) => isPastOrderStatus(o.status)),
    [orders],
  );

  const listData = tab === 'active' ? activeOrders : pastOrders;

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCancelPress = (order: CustomerOrderWithDetails) => {
    if (!order.bag) return;
    const eligibility = getCancellationEligibility(
      order.bag.available_date,
      order.bag.pickup_start,
      order.bag.pickup_end,
    );
    if (eligibility === 'blocked' || eligibility === 'expired') return;
    setCancelOrder(order);
  };

  const handleConfirmCancel = async (reason: string | null) => {
    if (!cancelOrder) return;

    setCancelSubmitting(true);
    const { error } = await cancelReservation(cancelOrder.id, reason);
    setCancelSubmitting(false);

    if (error) {
      Alert.alert('Could not cancel', error.message);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === cancelOrder.id ? { ...order, status: 'cancelled' } : order,
      ),
    );
    setExpandedId((prev) => (prev === cancelOrder.id ? null : prev));
    setCancelOrder(null);
    setShowCancelToast(true);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Bags</Text>
          <ShoppingBag size={24} color={Palette.white} strokeWidth={2} />
        </View>
        <Text style={styles.headerSubtitle}>Your reserved rescue bags</Text>

        <View style={styles.tabBar}>
          {(['active', 'past'] as TabKey[]).map((key) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={styles.tabSlot}>
                {active ? (
                  <Animated.View layout={Layout.duration(200)} style={styles.tabActive}>
                    <Text style={styles.tabTextActive}>
                      {key === 'active' ? 'Active' : 'Past'}
                    </Text>
                  </Animated.View>
                ) : (
                  <View style={styles.tabInactive}>
                    <Text style={styles.tabTextInactive}>
                      {key === 'active' ? 'Active' : 'Past'}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {fetchError ? (
        <View style={styles.errorWrap}>
          <RetryState message={fetchError} onRetry={loadOrders} />
        </View>
      ) : null}

      {loading && listData.length === 0 ? (
        <View style={styles.content}>
          <ListSkeleton count={3} />
        </View>
      ) : listData.length === 0 && !fetchError ? (
        <MyBagsEmpty tab={tab} onFind={() => router.push('/(tabs)/home')} />
      ) : (
        <FlashList
          data={listData}
          keyExtractor={(item) => item.id}
          style={styles.listWrap}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void onRefresh()}
              tintColor={Palette.primary}
              colors={[Palette.primary]}
            />
          }
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            const isActiveOrder = isActiveOrderStatus(item.status);
            const isPast = isPastOrderStatus(item.status);
            const showCancelRow = tab === 'active' && isActiveOrder;
            const cancelEligibility =
              showCancelRow && item.bag
                ? getCancellationEligibility(
                    item.bag.available_date,
                    item.bag.pickup_start,
                    item.bag.pickup_end,
                  )
                : 'blocked';
            const isCancelBlocked =
              cancelEligibility === 'blocked' || cancelEligibility === 'expired';
            const minsLeft = item.bag
              ? getPickupMinutesRemaining(item.bag.available_date, item.bag.pickup_end)
              : 0;
            const countdown = item.bag
              ? getPickupCountdownLabel(item.bag.available_date, item.bag.pickup_end)
              : '';
            const urgent = isActiveOrder && minsLeft > 0 && minsLeft < 60;

            return (
              <View style={[styles.card, isPast && styles.cardPast]}>
                <Pressable
                  onPress={() => isActiveOrder && toggleExpand(item.id)}
                  style={({ pressed }) => [styles.cardRow, pressed && isActiveOrder && { opacity: 0.95 }]}>
                  {isActiveOrder ? (
                    <Pressable onPress={() => toggleExpand(item.id)} style={styles.qrThumb}>
                      <QRCode value={item.qr_code} size={52} color={Palette.primary} />
                    </Pressable>
                  ) : (
                    <View style={[styles.qrThumb, styles.qrThumbMuted]}>
                      <Text style={styles.qrMutedEmoji}>{item.status === 'cancelled' ? '✕' : '✓'}</Text>
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <Text style={[styles.partnerName, isPast && styles.mutedText]}>{item.partner.name}</Text>
                    <Text style={[styles.bagTitle, isPast && styles.mutedText]} numberOfLines={1}>
                      {item.bag?.title ?? 'Rescue bag'}
                    </Text>
                    {isActiveOrder && countdown ? (
                      <Text style={[styles.countdown, urgent && styles.countdownUrgent]}>{countdown}</Text>
                    ) : null}
                    <Text style={[styles.cashLine, isPast && styles.mutedText]}>
                      {formatNprPaisa(item.total_price)} · Pay at pickup
                    </Text>
                    <View style={[styles.badge, { backgroundColor: `${statusColor(normalizeOrderStatus(item.status))}22` }]}>
                      <Text style={[styles.badgeText, { color: statusColor(normalizeOrderStatus(item.status)) }]}>
                        {statusLabel(normalizeOrderStatus(item.status))}
                      </Text>
                    </View>
                  </View>
                  {isActiveOrder ? (
                    <AppSymbol
                      ios={expanded ? 'chevron.up' : 'chevron.down'}
                      android={expanded ? 'expand-less' : 'expand-more'}
                      size={18}
                      color={Palette.textSecondary}
                    />
                  ) : null}
                </Pressable>

                {expanded && isActiveOrder ? (
                  <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.expanded}>
                    <View style={styles.fullQr}>
                      <QRCode value={item.qr_code} size={180} color={Palette.primary} />
                    </View>
                    <OrderShortCode qrCode={item.qr_code} />
                    <Text style={styles.scanHint}>Show this QR at pickup</Text>
                    <Pressable
                      onPress={() =>
                        openMapsDirections(
                          item.partner.latitude,
                          item.partner.longitude,
                          item.partner.name,
                        )
                      }>
                      <Text style={styles.link}>Get directions</Text>
                    </Pressable>
                  </Animated.View>
                ) : null}

                {showCancelRow ? (
                  <View style={styles.cancelRow}>
                    <View style={styles.cancelStatus}>
                      {cancelEligibility === 'free' ? (
                        <Text style={styles.cancelStatusText}>Cancel for free</Text>
                      ) : cancelEligibility === 'late' ? (
                        <Text style={styles.cancelLateText}>⚠️ Late cancellation</Text>
                      ) : (
                        <Text style={styles.cancelBlockedText}>🔒 Cannot cancel now</Text>
                      )}
                    </View>

                    {!isCancelBlocked ? (
                      <Pressable onPress={() => handleCancelPress(item)} hitSlop={8}>
                        <Text style={styles.cancelAction}>Cancel reservation</Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => router.push('/support/help')} hitSlop={8}>
                        <Text style={styles.helpLink}>Need help?</Text>
                      </Pressable>
                    )}
                  </View>
                ) : null}

                {isReviewEligibleOrderStatus(item.status) && !item.review ? (
                  <Pressable
                    onPress={() => router.push(`/review/${item.id}`)}
                    style={styles.leaveReviewBtn}>
                    <Text style={styles.leaveReviewText}>⭐ Leave a review</Text>
                  </Pressable>
                ) : null}

                {isReviewEligibleOrderStatus(item.status) && item.review ? (
                  <View style={styles.reviewedPill}>
                    <Text style={styles.reviewedPillText}>✓ Reviewed</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}

      <CancelReservationSheet
        visible={Boolean(cancelOrder)}
        order={cancelOrder}
        eligibility={
          cancelOrder
            ? getCancellationEligibility(
                cancelOrder.bag.available_date,
                cancelOrder.bag.pickup_start,
                cancelOrder.bag.pickup_end,
              )
            : 'free'
        }
        loading={cancelSubmitting}
        onClose={() => setCancelOrder(null)}
        onConfirm={(reason) => void handleConfirmCancel(reason)}
      />

      <SuccessToast
        visible={showPickupToast}
        title="✓ Pickup confirmed!"
        message="Your bag has been collected. Leave a review to help others!"
        onHide={() => setShowPickupToast(false)}
      />

      <SuccessToast
        visible={showCancelToast}
        title="✓ Reservation cancelled"
        message="The slot has been freed for other customers"
        onHide={() => setShowCancelToast(false)}
      />
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
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 999,
    padding: 3,
    marginTop: 16,
    height: 44,
  },
  tabSlot: {
    flex: 1,
    height: 38,
    justifyContent: 'center',
  },
  tabActive: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  tabInactive: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.primary,
  },
  tabTextInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  errorWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  listWrap: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 52,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyCtaText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    padding: Spacing.md,
    paddingBottom: 14,
    marginBottom: 12,
    gap: Spacing.sm,
    ...FloatingShadow,
  },
  cardPast: {
    opacity: 0.88,
    backgroundColor: '#FAFAF8',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  qrThumb: {
    padding: Spacing.xs,
    backgroundColor: '#FAECE7',
    borderRadius: 12,
  },
  qrThumbMuted: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrMutedEmoji: {
    fontSize: 22,
    color: Palette.textSecondary,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bagTitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  countdown: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  countdownUrgent: {
    color: Palette.amber,
  },
  cashLine: {
    ...Type.caption,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  mutedText: {
    color: Palette.textSecondary,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    marginTop: 2,
  },
  badgeText: {
    ...Type.label,
    fontWeight: '800',
  },
  expanded: {
    marginTop: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fullQr: {
    padding: Spacing.md,
    backgroundColor: '#FAECE7',
    borderRadius: 16,
  },
  scanHint: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  link: {
    ...Type.caption,
    color: Palette.primary,
    fontWeight: '700',
  },
  cancelRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#F0EDE8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cancelStatus: {
    flex: 1,
    gap: 2,
  },
  cancelStatusText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cancelTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelTimeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cancelLateText: {
    fontSize: 12,
    color: '#D97706',
    lineHeight: 16,
  },
  cancelBlockedText: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  cancelAction: {
    fontSize: 13,
    color: '#E24B4A',
    fontWeight: '500',
  },
  helpLink: {
    fontSize: 13,
    color: '#D85A30',
    fontWeight: '500',
  },
  leaveReviewBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#FAECE7',
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F0997B',
  },
  leaveReviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D85A30',
  },
  reviewedPill: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reviewedPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
});
