import { useRouter } from 'expo-router';
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
import { cancelReservation, fetchCustomerOrders } from '@/lib/orders';
import { hapticSuccess } from '@/lib/haptics';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { fetchUnreadCountsByOrder } from '@/lib/orderMessages';
import { supabase } from '@/lib/supabase';
import { useBagsStore } from '@/store/useBagsStore';
import type { CustomerOrderWithDetails } from '@/types/app';

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
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<CustomerMyBagsTab>('active');
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
  const [showPhoneToRestaurants, setShowPhoneToRestaurants] = useState(true);
  const [unreadByOrder, setUnreadByOrder] = useState<Record<string, number>>({});
  const [, tick] = useState(0);
  const refreshOrdersRef = useRef<() => Promise<void>>(async () => {});
  const isFirstLoad = useRef(true);
  const ordersCacheRef = useRef<CustomerOrderWithDetails[] | null>(null);

  useEffect(() => {
    const timer = setInterval(() => tick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

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
    } catch (err) {
      if (!ordersCacheRef.current) {
        setOrders([]);
      }
      setFetchError(err instanceof Error ? err.message : 'Failed to load orders');
    }
  }, []);

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

                setOrders((prev) => {
                  const exists = prev.find((order) => order.id === updatedOrder.id);
                  if (!exists) {
                    void refreshOrdersRef.current();
                    return prev;
                  }

                  return prev.map((order) =>
                    order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order,
                  );
                });

                if (updatedOrder.status === 'picked_up') {
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

  const handleConfirmCancel = async (reason: string | null) => {
    if (!cancelOrder) return;

    setCancelSubmitting(true);
    const result = await cancelReservation(cancelOrder.id, reason);
    setCancelSubmitting(false);

    if (result.error) {
      Alert.alert('Could not cancel', result.error.message);
      return;
    }

    if (result.bagId && result.bagStock) {
      useBagsStore.getState().applyBagStock(result.bagId, result.bagStock);
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === cancelOrder.id ? { ...order, status: 'cancelled' } : order,
      ),
    );
    setExpandedId((prev) => (prev === cancelOrder.id ? null : prev));
    setCancelOrder(null);
    void hapticSuccess();
    setShowCancelToast(true);
  };

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
          onReview={() => router.push(`/review/${item.id}`)}
          onHelp={() => router.push('/support/help')}
          onViewRestaurant={() => router.push(`/partner/${item.partner_id}`)}
          onChat={() => router.push(`/order/chat/${item.id}`)}
          onPrivacySettings={() => router.push('/profile/privacy')}
          onFindNearby={() => router.push('/(tabs)/customer/home')}
          unreadMessages={unreadByOrder[item.id] ?? 0}
        />
      );
    },
    [expandedId, router, showPhoneToRestaurants, tab, unreadByOrder],
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
        onConfirm={(reason) => void handleConfirmCancel(reason)}
      />

      <SuccessToast
        visible={showPickupToast}
        title="Pickup confirmed"
        message="Your bag has been collected. Enjoy your meal!"
        onHide={() => setShowPickupToast(false)}
      />

      <SuccessToast
        visible={showCancelToast}
        title="Reservation cancelled"
        message="The slot has been freed for other customers."
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
