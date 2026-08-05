import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CancelReservationSheet } from '@/components/customer/CancelReservationSheet';
import { PostPickupReview } from '@/components/customer/PostPickupReview';
import { ReportSheet } from '@/components/customer/ReportSheet';
import { CustomerMyBagsEmpty } from '@/components/customer/my-bags/CustomerMyBagsEmpty';
import {
  CustomerMyBagsHeader,
  type CustomerMyBagsTab,
} from '@/components/customer/my-bags/CustomerMyBagsHeader';
import { CustomerOrderCard } from '@/components/customer/my-bags/CustomerOrderCard';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { getCancellationEligibility, CANCELLATION_BLOCKED_MESSAGE } from '@/constants/cancellation';
import { Spacing } from '@/constants/theme';
import {
  getPickupCountdownLabel,
  getPickupMinutesRemaining,
  openMapsDirections,
} from '@/lib/helpers';
import { normalizeOrderStatus } from '@/lib/orderStatus';
import { cancelReservation, fetchCustomerOrders, reduceReservationQuantity } from '@/lib/orders';
import { hapticSuccess } from '@/lib/haptics';
import { markReviewPromptShown, wasReviewPromptShown } from '@/lib/reviewPrompt';
import { submitCustomerReview } from '@/lib/reviews';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { fetchUnreadCountsByOrder } from '@/lib/orderMessages';
import { supabase } from '@/lib/supabase';
import { useBagsStore } from '@/store/useBagsStore';
import type { CustomerOrderWithDetails } from '@/types/app';
import type { Review } from '@/types/database';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACTIVE_STATUSES = ['confirmed', 'pending'] as const;
const PAST_STATUSES = ['picked_up', 'cancelled', 'missed'] as const;

function isActiveOrderStatus(status: string) {
  return ACTIVE_STATUSES.includes(normalizeOrderStatus(status) as (typeof ACTIVE_STATUSES)[number]);
}

function isPastOrderStatus(status: string) {
  const normalized = normalizeOrderStatus(status);
  return PAST_STATUSES.includes(normalized as (typeof PAST_STATUSES)[number]);
}

export default function MyBagsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ review?: string; show_review?: string }>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<CustomerMyBagsTab>('active');
  const [orders, setOrders] = useState<CustomerOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cancelOrder, setCancelOrder] = useState<CustomerOrderWithDetails | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [showCancelToast, setShowCancelToast] = useState(false);
  const [cancelToastMessage, setCancelToastMessage] = useState({
    title: 'Reservation cancelled',
    message: 'The slot has been freed for other customers.',
  });
  const [showPickupToast, setShowPickupToast] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<CustomerOrderWithDetails | null>(null);
  const [reportOrder, setReportOrder] = useState<CustomerOrderWithDetails | null>(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showReviewToast, setShowReviewToast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showPhoneToRestaurants, setShowPhoneToRestaurants] = useState(true);
  const [unreadByOrder, setUnreadByOrder] = useState<Record<string, number>>({});
  const [, tick] = useState(0);
  const refreshOrdersRef = useRef<() => Promise<void>>(async () => {});
  const isFirstLoad = useRef(true);
  const ordersCacheRef = useRef<CustomerOrderWithDetails[] | null>(null);
  const reviewPromptedRef = useRef(new Set<string>());
  const scheduleReviewPromptRef = useRef<(orderId: string) => void>(() => {});

  useEffect(() => {
    const timer = setInterval(() => tick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const openReviewPrompt = useCallback(async (order: CustomerOrderWithDetails, opts?: { force?: boolean }) => {
    if (__DEV__) console.log('[Review] openReviewPrompt called', {
      orderId: order.id,
      status: order.status,
      hasReview: Boolean(order.review),
      force: opts?.force,
    });

    if (order.review) {
      if (__DEV__) console.log('[Review] blocked because: order already has a review');
      return;
    }

    if (normalizeOrderStatus(order.status) !== 'picked_up') {
      if (__DEV__) console.log('[Review] blocked because: status is not picked_up', order.status);
      return;
    }

    if (!opts?.force) {
      if (reviewPromptedRef.current.has(order.id)) {
        if (__DEV__) console.log('[Review] blocked because: already prompted this session');
        return;
      }

      const shown = await wasReviewPromptShown(order.id);
      if (shown) {
        if (__DEV__) console.log('[Review] blocked because: AsyncStorage says already shown');
        return;
      }
    }

    if (__DEV__) console.log('[Review] showing PostPickupReview for', order.id);
    reviewPromptedRef.current.add(order.id);
    setTab('past');
    setReviewOrder(order);
    setShowReviewPrompt(true);
    // Mark as shown after display so skip/dismiss does not rely only on session ref.
    void markReviewPromptShown(order.id);
  }, []);

  const scheduleReviewPrompt = useCallback(
    (orderId: string) => {
      if (__DEV__) console.log('[Review] scheduling review prompt for order:', orderId);
      setTimeout(() => {
        const order = ordersCacheRef.current?.find((row) => row.id === orderId);
        if (!order) {
          if (__DEV__) console.log('[Review] blocked because: order not found in cache after delay', orderId);
          void refreshOrdersRef.current().then(() => {
            const refreshed = ordersCacheRef.current?.find((row) => row.id === orderId);
            if (!refreshed) return;
            reviewPromptedRef.current.delete(orderId);
            void openReviewPrompt({ ...refreshed, status: 'picked_up' }, { force: true });
          });
          return;
        }
        // Fresh pickup event — allow even if a stale session flag exists.
        reviewPromptedRef.current.delete(orderId);
        void openReviewPrompt({ ...order, status: 'picked_up' }, { force: true });
      }, 1200);
    },
    [openReviewPrompt],
  );
  scheduleReviewPromptRef.current = scheduleReviewPrompt;

  const checkForPendingReviews = useCallback(
    (list: CustomerOrderWithDetails[]) => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const needsReview = list.find((o) => {
        if (normalizeOrderStatus(o.status) !== 'picked_up') return false;
        if (o.review) return false;
        if (!o.picked_up_at) return false;
        if (reviewPromptedRef.current.has(o.id)) return false;
        return new Date(o.picked_up_at) > twoHoursAgo;
      });

      if (!needsReview) return;
      if (__DEV__) console.log('[Review] Found pending review on mount:', needsReview.id);
      setTimeout(() => {
        void openReviewPrompt(needsReview, { force: true });
      }, 1000);
    },
    [openReviewPrompt],
  );

  const refreshOrders = useCallback(async () => {
    setFetchError(null);

    if (ordersCacheRef.current) {
      setOrders(ordersCacheRef.current);
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setCustomerId(null);
      setOrders([]);
      return;
    }

    setCustomerId(userId);

    try {
      const [{ data: privacyRow }, rows] = await Promise.all([
        supabase
          .from('profiles')
          .select('privacy_settings')
          .eq('id', userId)
          .maybeSingle(),
        fetchCustomerOrders(userId),
      ]);

      const settings = (privacyRow as { privacy_settings?: { show_phone?: boolean } } | null)
        ?.privacy_settings;
      setShowPhoneToRestaurants(settings?.show_phone ?? true);

      ordersCacheRef.current = rows;
      setOrders(rows);
      const counts = await fetchUnreadCountsByOrder(
        rows.map((row) => row.id),
        userId,
      );
      setUnreadByOrder(counts);
      checkForPendingReviews(rows);
    } catch (err) {
      if (!ordersCacheRef.current) {
        setOrders([]);
      }
      setFetchError(err instanceof Error ? err.message : 'Failed to load orders');
    }
  }, [checkForPendingReviews]);

  refreshOrdersRef.current = refreshOrders;

  const loadOrders = useCallback(async () => {
    if (isFirstLoad.current) {
      setLoading(true);
    }
    await refreshOrders();
    setLoading(false);
    isFirstLoad.current = false;
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
    if (!customerId) return;

    let cancelled = false;
    const channelName = `customer-my-bags-${customerId}`;

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
                const updatedOrder = (payload as { new?: Partial<CustomerOrderWithDetails> }).new;
                if (!updatedOrder?.id) return;

                const prevStatus = ordersCacheRef.current?.find(
                  (row) => row.id === updatedOrder.id,
                )?.status;

                setOrders((prev) => {
                  const exists = prev.find((order) => order.id === updatedOrder.id);
                  if (!exists) {
                    void refreshOrdersRef.current();
                    return prev;
                  }

                  const next = prev.map((order) =>
                    order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order,
                  );
                  ordersCacheRef.current = next;
                  return next;
                });

                const nextStatus = normalizeOrderStatus(String(updatedOrder.status ?? ''));
                const wasPickedUp = normalizeOrderStatus(String(prevStatus ?? '')) === 'picked_up';
                if (nextStatus === 'picked_up' && !wasPickedUp) {
                  if (__DEV__) console.log(
                    '[Review] Order picked up, scheduling review:',
                    updatedOrder.id,
                  );
                  void hapticSuccess();
                  setTab('past');
                  setExpandedId(updatedOrder.id);
                  setShowPickupToast(true);
                  scheduleReviewPromptRef.current?.(updatedOrder.id);
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
            {
              event: '*',
              table: 'order_messages',
              callback: () => {
                const ids = ordersCacheRef.current?.map((row) => row.id) ?? [];
                if (!ids.length) return;
                void (async () => {
                  const counts = await fetchUnreadCountsByOrder(ids, customerId);
                  setUnreadByOrder(counts);
                })();
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

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshOrdersRef.current();
      }
    });

    return () => {
      cancelled = true;
      void removeChannelByName(supabase, channelName);
      appStateSub.remove();
    };
  }, [customerId]);

  const activeOrders = useMemo(
    () => orders.filter((order) => isActiveOrderStatus(order.status)),
    [orders],
  );
  const pastOrders = useMemo(
    () => orders.filter((order) => isPastOrderStatus(order.status)),
    [orders],
  );

  const listData = tab === 'active' ? activeOrders : pastOrders;

  // Deep link / notification tap: ?review=orderId or ?show_review=orderId
  useEffect(() => {
    const reviewId =
      (typeof params.review === 'string' && params.review) ||
      (typeof params.show_review === 'string' && params.show_review) ||
      undefined;
    if (!reviewId || loading) return;
    const order = orders.find((row) => row.id === reviewId);
    if (!order) return;
    void (async () => {
      await openReviewPrompt(order, { force: true });
      router.setParams({ review: undefined, show_review: undefined });
    })();
  }, [params.review, params.show_review, orders, loading, openReviewPrompt, router]);

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
    if (eligibility === 'blocked' || eligibility === 'expired') {
      Alert.alert('Cannot cancel now', CANCELLATION_BLOCKED_MESSAGE);
      return;
    }
    setCancelOrder(order);
  };

  const handleConfirmCancel = async (payload: {
    reason: string | null;
    cancelQuantity: number;
  }) => {
    if (!cancelOrder) return;

    const { reason, cancelQuantity } = payload;
    const isPartial =
      cancelOrder.quantity > 1 &&
      cancelQuantity > 0 &&
      cancelQuantity < cancelOrder.quantity;

    setCancelSubmitting(true);
    const result = isPartial
      ? await reduceReservationQuantity(
          cancelOrder.id,
          cancelOrder.quantity - cancelQuantity,
          reason,
        )
      : await cancelReservation(cancelOrder.id, reason);
    setCancelSubmitting(false);

    if (result.error) {
      Alert.alert('Could not cancel', result.error.message);
      return;
    }

    if (result.bagId && result.bagStock) {
      useBagsStore.getState().applyBagStock(result.bagId, result.bagStock);
    }

    if (isPartial && 'order' in result && result.order) {
      setOrders((prev) =>
        prev.map((order) => (order.id === cancelOrder.id ? result.order! : order)),
      );
    } else {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === cancelOrder.id ? { ...order, status: 'cancelled' } : order,
        ),
      );
      setExpandedId((prev) => (prev === cancelOrder.id ? null : prev));
    }

    setCancelOrder(null);
    void hapticSuccess();
    setCancelToastMessage(
      isPartial
        ? {
            title: 'Quantity updated',
            message: `Cancelled ${cancelQuantity}. Remaining bags stay reserved.`,
          }
        : {
            title: 'Reservation cancelled',
            message: 'The slot has been freed for other customers.',
          },
    );
    setShowCancelToast(true);
  };

  const dismissReviewPrompt = useCallback(() => {
    if (reviewOrder) {
      void markReviewPromptShown(reviewOrder.id);
    }
    setShowReviewPrompt(false);
    setReviewOrder(null);
  }, [reviewOrder]);

  const handleSubmitReview = useCallback(
    async (rating: number, comment: string) => {
      if (!reviewOrder || !customerId) return false;

      setReviewSubmitting(true);
      const result = await submitCustomerReview({
        orderId: reviewOrder.id,
        customerId,
        partnerId: reviewOrder.partner_id,
        rating,
        comment,
      });
      setReviewSubmitting(false);

      if (result.error) {
        const code =
          typeof result.error === 'object' && result.error && 'code' in result.error
            ? String((result.error as { code?: string }).code)
            : '';
        if (code === '23505') {
          Alert.alert('Already reviewed', 'You already reviewed this order.');
          dismissReviewPrompt();
          void refreshOrdersRef.current();
          return false;
        }
        const message =
          result.error instanceof Error
            ? result.error.message
            : typeof result.error === 'object' && result.error && 'message' in result.error
              ? String((result.error as { message: unknown }).message)
              : 'Could not submit review.';
        Alert.alert('Could not submit', message);
        return false;
      }

      const localReview: Review = {
        id: `local-${reviewOrder.id}`,
        order_id: reviewOrder.id,
        customer_id: customerId,
        partner_id: reviewOrder.partner_id,
        rating,
        comment: comment.trim() || null,
        quantity_feedback: null,
        value_feedback: null,
        would_return: null,
        photo_url: null,
        partner_reply: null,
        partner_replied_at: null,
        created_at: new Date().toISOString(),
      };

      setOrders((prev) => {
        const next = prev.map((row) =>
          row.id === reviewOrder.id ? { ...row, review: localReview } : row,
        );
        ordersCacheRef.current = next;
        return next;
      });

      void markReviewPromptShown(reviewOrder.id);
      return true;
    },
    [customerId, dismissReviewPrompt, reviewOrder],
  );

  const renderItem = useCallback(
    ({ item }: { item: CustomerOrderWithDetails }) => {
      const expanded = expandedId === item.id;
      const isActiveOrder = isActiveOrderStatus(item.status);
      const showCancelRow = tab === 'active' && isActiveOrder;
      const cancelEligibility =
        showCancelRow && item.bag
          ? getCancellationEligibility(
              item.bag.available_date,
              item.bag.pickup_start,
              item.bag.pickup_end,
            )
          : 'blocked';
      const minsLeft = item.bag
        ? getPickupMinutesRemaining(item.bag.available_date, item.bag.pickup_end)
        : 0;
      const countdown = item.bag
        ? getPickupCountdownLabel(item.bag.available_date, item.bag.pickup_end)
        : '';
      const urgent = isActiveOrder && minsLeft > 0 && minsLeft < 60;

      return (
        <CustomerOrderCard
          order={item}
          tab={tab}
          expanded={expanded}
          countdown={countdown}
          urgent={urgent}
          cancelEligibility={cancelEligibility}
          showCancelRow={showCancelRow}
          showPhoneToRestaurants={showPhoneToRestaurants}
          onToggleExpand={() => toggleExpand(item.id)}
          onCancelPress={() => handleCancelPress(item)}
          onDirections={() =>
            openMapsDirections(item.partner.latitude, item.partner.longitude, item.partner.name)
          }
          onReview={() => void openReviewPrompt(item, { force: true })}
          onHelp={() => router.push('/support/help')}
          onViewRestaurant={() => router.push(`/partner/${item.partner_id}`)}
          onChat={() => router.push(`/order/chat/${item.id}`)}
          onPrivacySettings={() => router.push('/profile/privacy')}
          onFindNearby={() => router.push('/(tabs)/customer/home')}
          onReport={() => setReportOrder(item)}
          unreadMessages={unreadByOrder[item.id] ?? 0}
        />
      );
    },
    [expandedId, openReviewPrompt, router, showPhoneToRestaurants, tab, unreadByOrder],
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <CustomerMyBagsHeader
        tab={tab}
        activeCount={activeOrders.length}
        paddingTop={insets.top + Spacing.sm}
        onTabChange={setTab}
      />

      {fetchError ? (
        <View style={styles.errorWrap}>
          <RetryState message={fetchError} onRetry={loadOrders} />
        </View>
      ) : null}

      {isFirstLoad.current && loading && listData.length === 0 ? (
        <View style={styles.content}>
          <ListSkeleton count={3} />
        </View>
      ) : listData.length === 0 && !fetchError ? (
        <CustomerMyBagsEmpty tab={tab} />
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
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
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
        onConfirm={(payload) => void handleConfirmCancel(payload)}
      />

      <PostPickupReview
        visible={showReviewPrompt && Boolean(reviewOrder)}
        order={reviewOrder}
        submitting={reviewSubmitting}
        onSubmit={handleSubmitReview}
        onDismiss={dismissReviewPrompt}
      />

      {reportOrder ? (
        <ReportSheet
          visible
          partnerId={reportOrder.partner_id}
          partnerName={reportOrder.partner.name}
          orderId={reportOrder.id}
          onClose={() => setReportOrder(null)}
        />
      ) : null}

      <SuccessToast
        visible={showPickupToast}
        title="Pickup confirmed"
        message="Moved to Past orders. Enjoy your meal!"
        onHide={() => setShowPickupToast(false)}
      />

      <SuccessToast
        visible={showReviewToast}
        title="Review submitted! Thank you 🙏"
        onHide={() => setShowReviewToast(false)}
      />

      <SuccessToast
        visible={showCancelToast}
        title={cancelToastMessage.title}
        message={cancelToastMessage.message}
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
  errorWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  listWrap: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 120,
  },
});
