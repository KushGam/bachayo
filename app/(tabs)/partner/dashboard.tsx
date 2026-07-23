import { useRouter, useFocusEffect } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActiveBagMiniCard } from '@/components/partner/ActiveBagMiniCard';
import { DashboardHeroBlock } from '@/components/partner/DashboardHeroBlock';
import { DashboardCtaCard } from '@/components/partner/DashboardCtaCard';
import { buildDashboardStats } from '@/components/partner/DashboardStatsRow';
import { PartnerEmptyState } from '@/components/partner/PartnerEmptyState';
import { PartnerOrderRow } from '@/components/partner/PartnerOrderRow';
import { PartnerSectionHeader } from '@/components/partner/PartnerSectionHeader';
import { DashboardQuickActions } from '@/components/partner/DashboardQuickActions';
import { SubscriptionBanner } from '@/components/partner/SubscriptionBanner';
import { RetryState } from '@/components/ui/RetryState';
import { OrderCardSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { getCategoryById } from '@/constants/partnerCategories';
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import {
  formatTodayBilingual,
  getTodayIsoDateLocal,
  getYesterdayIsoDateLocal,
} from '@/lib/helpers';
import { hapticButtonPress, hapticSuccess } from '@/lib/haptics';
import { isReservedOrderStatus, normalizeOrderStatus } from '@/lib/orderStatus';
import {
  confirmPartnerPickup,
  fetchPartnerDayStats,
  fetchPartnerOrders,
} from '@/lib/orders';
import { fetchPartnerBagOrders, fetchPartnerBagsForDate, applyBagStockPatch, applyReservationToPartnerBag, type PartnerBagOrder, type PartnerBagWithStats } from '@/lib/partnerBags';
import { applyFetchedOrdersWithPickupGuard, isPickupFetchBlocked, protectPendingPickup } from '@/lib/pendingPickups';
import { getPartnerApprovalStatus, type PartnerApprovalFields } from '@/lib/partnerApproval';
import {
  getDaysUntil,
  getSubscriptionExpiryIso,
  getTrialDaysRemaining,
  type PartnerSubscriptionFields,
} from '@/lib/subscriptions';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { fetchUnreadCountsByOrder } from '@/lib/orderMessages';
import { supabase } from '@/lib/supabase';
import { usePartnerStore } from '@/store/usePartnerStore';
import type { PartnerOrderWithCustomer } from '@/types/app';
import type { Partner } from '@/types/database';

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useAuthStore((s) => s.locale);
  const partner = usePartnerStore((s) => s.partner);
  const setPartnerInStore = usePartnerStore((s) => s.setPartner);
  const refreshPartner = usePartnerStore((s) => s.refreshPartner);
  const [bags, setBags] = useState<PartnerBagWithStats[]>([]);
  const [orders, setOrders] = useState<PartnerOrderWithCustomer[]>([]);
  const [todayStats, setTodayStats] = useState({
    bagsListed: 0,
    reserved: 0,
    pickedUp: 0,
    revenue: 0,
  });
  const [yesterdayStats, setYesterdayStats] = useState<typeof todayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedBagId, setExpandedBagId] = useState<string | null>(null);
  const [bagOrdersMap, setBagOrdersMap] = useState<Record<string, PartnerBagOrder[] | null>>({});
  const [bagOrdersLoading, setBagOrdersLoading] = useState<string | null>(null);
  const [markingPickup, setMarkingPickup] = useState<string | null>(null);
  const [unreadByOrder, setUnreadByOrder] = useState<Record<string, number>>({});
  const lastPickupTime = useRef(0);
  const pendingPickupIds = useRef(new Set<string>());

  const today = getTodayIsoDateLocal();
  const yesterday = getYesterdayIsoDateLocal();
  const dates = useMemo(() => formatTodayBilingual(), []);

  const loadData = useCallback(async () => {
    setFetchError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (partnerError) throw partnerError;
      if (!partnerData) {
        setPartnerInStore(null);
        setBags([]);
        setOrders([]);
        setLoading(false);
        return;
      }

      setPartnerInStore(partnerData);

      const [bagRows, orderRows, statsToday, statsYesterday] = await Promise.all([
        fetchPartnerBagsForDate(partnerData.id, today),
        fetchPartnerOrders(partnerData.id, today),
        fetchPartnerDayStats(partnerData.id, today),
        fetchPartnerDayStats(partnerData.id, yesterday),
      ]);

      const visibleBags = bagRows.filter(
        (bag) => bag.status === 'active' || bag.status === 'sold_out',
      );

      setBags(visibleBags);
      const nextOrders = applyFetchedOrdersWithPickupGuard(orderRows, pendingPickupIds.current, []);
      setOrders(nextOrders);
      const counts = await fetchUnreadCountsByOrder(
        nextOrders.map((row) => row.id),
        userId,
      );
      setUnreadByOrder(counts);
      if (!isPickupFetchBlocked(lastPickupTime.current)) {
        setTodayStats(statsToday);
        setYesterdayStats(statsYesterday);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [today, yesterday, setPartnerInStore]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void refreshPartner();
      void loadData();
    }, [loadData, refreshPartner]),
  );

  useEffect(() => {
    if (!partner?.id) return;

    const channelName = `partner-dashboard-${partner.id}`;
    let cancelled = false;

    void (async () => {
      try {
        await subscribePostgresChannel(
          supabase,
          channelName,
          [
            {
              event: 'UPDATE',
              table: 'orders',
              filter: `partner_id=eq.${partner.id}`,
              callback: (payload) => {
                const updated = (payload as { new?: PartnerOrderWithCustomer }).new;
                if (!updated?.id) return;

                if (isPickupFetchBlocked(lastPickupTime.current)) {
                  console.log('[realtime] blocked stale update');
                  return;
                }

                setOrders((prev) => {
                  const index = prev.findIndex((row) => row.id === updated.id);
                  if (index === -1) {
                    if (!isPickupFetchBlocked(lastPickupTime.current)) {
                      void loadDataRef.current();
                    }
                    return prev;
                  }

                  const current = prev[index];
                  if (current.status === 'picked_up' && updated.status === 'confirmed') {
                    return prev;
                  }

                  return prev.map((row) =>
                    row.id === updated.id ? { ...row, ...updated } : row,
                  );
                });
              },
            },
            {
              event: 'INSERT',
              table: 'orders',
              filter: `partner_id=eq.${partner.id}`,
              callback: (payload) => {
                if (isPickupFetchBlocked(lastPickupTime.current)) return;

                const inserted = (payload as {
                  new?: {
                    id?: string;
                    bag_id?: string;
                    quantity?: number;
                    status?: string;
                    total_price?: number;
                  };
                }).new;

                if (inserted?.bag_id) {
                  const qty = inserted.quantity ?? 1;
                  const status = inserted.status ?? 'confirmed';

                  setBags((prev) =>
                    prev.map((bag) =>
                      bag.id === inserted.bag_id
                        ? applyReservationToPartnerBag(
                            bag,
                            qty,
                            status,
                            inserted.total_price ?? 0,
                          )
                        : bag,
                    ),
                  );

                  setTodayStats((prev) => ({
                    ...prev,
                    reserved: prev.reserved + qty,
                  }));

                  if (inserted.id) {
                    setBagOrdersMap((prev) => {
                      const next = { ...prev };
                      delete next[inserted.bag_id!];
                      return next;
                    });
                  }
                }

                void loadDataRef.current();
              },
            },
            {
              event: 'UPDATE',
              table: 'rescue_bags',
              callback: (payload) => {
                const updated = (payload as {
                  new?: {
                    id?: string;
                    quantity_reserved?: number;
                    quantity_available?: number;
                    status?: PartnerBagWithStats['status'];
                  };
                }).new;

                if (!updated?.id) return;

                setBags((prev) =>
                  prev.map((bag) =>
                    bag.id === updated.id
                      ? applyBagStockPatch(bag, {
                          quantity_reserved: updated.quantity_reserved,
                          quantity_available: updated.quantity_available,
                          status: updated.status,
                        })
                      : bag,
                  ),
                );
              },
            },
            {
              event: '*',
              table: 'order_messages',
              callback: () => {
                const ids = orders.map((row) => row.id);
                if (!ids.length) return;
                void (async () => {
                  const { data: sessionData } = await supabase.auth.getSession();
                  const userId = sessionData.session?.user?.id;
                  if (!userId) return;
                  const counts = await fetchUnreadCountsByOrder(ids, userId);
                  setUnreadByOrder(counts);
                })();
              },
            },
          ],
          () => cancelled,
        );
      } catch (error) {
        if (!cancelled) {
          console.warn('[dashboard] realtime subscribe failed:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      void removeChannelByName(supabase, channelName);
    };
  }, [partner?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const statCards = useMemo(
    () => buildDashboardStats({ ...todayStats, yesterday: yesterdayStats ?? undefined }),
    [todayStats, yesterdayStats],
  );

  const activeOrders = useMemo(
    () => orders.filter((order) => isReservedOrderStatus(order.status)).length,
    [orders],
  );

  const totalBagsReserved = useMemo(
    () => bags.reduce((sum, bag) => sum + bag.quantity_reserved, 0),
    [bags],
  );

  const handleToggleBagOrders = useCallback(
    async (bagId: string) => {
      void hapticButtonPress();
      const willExpand = expandedBagId !== bagId;
      setExpandedBagId(willExpand ? bagId : null);
    if (!willExpand) return;

    setBagOrdersLoading(bagId);
    try {
      const rows = await fetchPartnerBagOrders(bagId);
      setBagOrdersMap((prev) => ({
        ...prev,
        [bagId]: applyFetchedOrdersWithPickupGuard(
          rows,
          pendingPickupIds.current,
          prev[bagId] ?? [],
        ),
      }));
      } catch {
        setBagOrdersMap((prev) => ({ ...prev, [bagId]: [] }));
      } finally {
        setBagOrdersLoading(null);
      }
    },
    [expandedBagId],
  );

  const markAsPickedUp = useCallback(
    (orderId: string) => {
      const order = orders.find((row) => row.id === orderId);
      if (!order) return;

      if (normalizeOrderStatus(order.status) === 'picked_up') {
        return;
      }

      Alert.alert(
        'Confirm pickup',
        'Has the customer collected their bag and paid?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, confirmed ✓',
            onPress: () => {
              void (async () => {
                setMarkingPickup(orderId);
                const result = await confirmPartnerPickup(order, 'partner_manual', partner?.name);

                if (!result.ok) {
                  Alert.alert('Error', result.errorMessage ?? 'Failed to confirm. Please try again.');
                  setMarkingPickup(null);
                  return;
                }

                lastPickupTime.current = Date.now();
                protectPendingPickup(pendingPickupIds.current, orderId);

                const pickedUpAt = result.alreadyPickedUp
                  ? order.picked_up_at ?? new Date().toISOString()
                  : new Date().toISOString();

                setOrders((prev) =>
                  prev.map((row) =>
                    row.id === orderId
                      ? { ...row, status: 'picked_up', picked_up_at: pickedUpAt }
                      : row,
                  ),
                );

                setBags((prev) =>
                  prev.map((bag) => {
                    if (bag.id !== order.bag_id) return bag;
                    const qty = order.quantity ?? 1;
                    return {
                      ...bag,
                      quantity_reserved: Math.max(0, bag.quantity_reserved - qty),
                      reserved_orders: Math.max(0, bag.reserved_orders - 1),
                      confirmed_orders: Math.max(0, bag.confirmed_orders - 1),
                      picked_up_orders: bag.picked_up_orders + 1,
                      picked_up_bags: bag.picked_up_bags + qty,
                      potential_revenue: Math.max(0, bag.potential_revenue - order.total_price),
                      revenue_earned: bag.revenue_earned + order.total_price,
                    };
                  }),
                );

                setBagOrdersMap((prev) => {
                  const bagId = order.bag_id;
                  const list = prev[bagId];
                  if (!list) return prev;
                  return {
                    ...prev,
                    [bagId]: list.map((row) =>
                      row.id === orderId
                        ? { ...row, status: 'picked_up', picked_up_at: pickedUpAt }
                        : row,
                    ),
                  };
                });

                if (!result.alreadyPickedUp) {
                  setTodayStats((prev) => ({
                    ...prev,
                    pickedUp: prev.pickedUp + (order.quantity ?? 1),
                    reserved: Math.max(0, prev.reserved - (order.quantity ?? 1)),
                  }));
                }

                setMarkingPickup(null);
                if (!result.alreadyPickedUp) {
                  void hapticSuccess();
                }
              })();
            },
          },
        ],
      );
    },
    [orders, partner?.name],
  );
  const categoryMeta = partner ? getCategoryById(partner.category) : null;

  const subscriptionStatus =
    (partner as (Partner & PartnerSubscriptionFields) | null)?.subscription_status ?? 'trial';
  const trialDaysLeft = getTrialDaysRemaining(
    (partner as (Partner & PartnerSubscriptionFields) | null)?.trial_ends_at,
  );
  useEffect(() => {
    if (!partner) return;
    const status = getPartnerApprovalStatus(partner as PartnerApprovalFields);
    if (status === 'rejected') {
      router.replace('/(auth)/partner-rejected');
      return;
    }
    if (status === 'suspended') {
      router.replace('/(auth)/partner-suspended');
      return;
    }
    if (status === 'deleted') {
      router.replace('/(auth)/partner-deleted');
    }
  }, [partner, router]);

  const showOverlapBanner =
    partner &&
    (subscriptionStatus === 'past_due' ||
      subscriptionStatus === 'paused' ||
      subscriptionStatus === 'cancelled' ||
      (subscriptionStatus === 'trial' && trialDaysLeft <= 7) ||
      (subscriptionStatus === 'active' &&
        (() => {
          const days = getDaysUntil(
            getSubscriptionExpiryIso(partner as PartnerSubscriptionFields),
          );
          return days !== null && days <= 7;
        })()));

  const approvalStatus = partner ? getPartnerApprovalStatus(partner as PartnerApprovalFields) : 'approved';
  const isPendingApproval = approvalStatus === 'pending';

  if (!loading && !partner) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.fallback}>
        <StatusBar style="dark" />
        <Text style={styles.fallbackTitle}>Complete onboarding to access your dashboard.</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screenWrap}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
        }>
      <StatusBar style="light" />

      {partner ? (
        <DashboardHeroBlock
          partnerName={partner.name}
          categoryLabel={locale === 'np' ? (categoryMeta?.labelNp ?? '') : (categoryMeta?.label ?? '')}
          categoryIcon={categoryMeta?.icon ?? ''}
          dateLabel={locale === 'np' ? dates.np : dates.en}
          paddingTop={insets.top + Spacing.md}
          stats={statCards}
          loading={loading}
          onNotifications={() => {
            void hapticButtonPress();
            router.push('/notifications');
          }}
          onMessages={() => {
            void hapticButtonPress();
            router.push('/messages');
          }}
        />
      ) : (
        <View style={[styles.headerPlaceholder, { paddingTop: insets.top + Spacing.md }]} />
      )}

      {partner ? (
        <SubscriptionBanner partner={partner} placement="content" />
      ) : null}

      {partner && showOverlapBanner ? <SubscriptionBanner partner={partner} placement="overlap" /> : null}

      <View style={styles.content}>
        {fetchError ? (
          <View style={styles.retryWrap}>
            <RetryState message={fetchError} onRetry={loadData} />
          </View>
        ) : null}

        {partner ? (
          <>
            <DashboardQuickActions
              onScan={() => router.push('/(tabs)/partner/scan')}
              onMyBags={() => router.push('/(tabs)/partner/my-bags')}
            />
            <DashboardCtaCard
              category={partner.category}
              compact={bags.length > 0}
              onPress={() => router.push('/partner/add-bag')}
            />
          </>
        ) : loading ? (
          <View style={styles.ctaSkeleton} />
        ) : null}

      <PartnerSectionHeader
        title="Active today"
        count={bags.length > 0 ? totalBagsReserved : undefined}
        countSuffix="reserved"
        actionLabel={bags.length > 0 ? 'Manage' : undefined}
        onAction={bags.length > 0 ? () => router.push('/(tabs)/partner/my-bags') : undefined}
      />

      {loading ? (
        <View style={styles.bagsSkeleton}>
          <View style={styles.bagSkeletonCard} />
          <View style={styles.bagSkeletonCard} />
        </View>
      ) : bags.length === 0 ? (
        <PartnerEmptyState
          ios="bag.fill"
          android="shopping-bag"
          title="No bags listed today"
          subtitle="List your first rescue bag to start receiving orders"
          dashed
          compact
        />
      ) : (
        <View style={styles.bagsList}>
          {bags.map((bag) => {
            const loadedOrders = bagOrdersMap[bag.id];

            return (
              <ActiveBagMiniCard
                key={bag.id}
                bag={bag}
                waitingCustomers={bag.reserved_orders}
                summaryOrders={loadedOrders}
                summaryFallback={{
                  orderCount: bag.reserved_orders,
                  bagCount: Math.max(bag.quantity_reserved, bag.reserved_orders),
                  revenuePaisa: bag.potential_revenue,
                }}
                isOrdersExpanded={expandedBagId === bag.id}
                bagOrders={bagOrdersMap[bag.id] ?? null}
                ordersLoading={bagOrdersLoading === bag.id}
                markingPickup={markingPickup}
                onToggleOrders={() => void handleToggleBagOrders(bag.id)}
                onMarkPickedUp={markAsPickedUp}
              />
            );
          })}
          <Pressable
            onPress={() => {
              void hapticButtonPress();
              router.push('/partner/add-bag');
            }}
            style={({ pressed }) => [styles.addAnother, pressed && styles.addAnotherPressed]}>
            <Text style={styles.addAnotherPlus}>+</Text>
            <Text style={styles.addAnotherText}>Add another bag</Text>
          </Pressable>
        </View>
      )}

      <PartnerSectionHeader
        title="Orders"
        count={activeOrders > 0 ? activeOrders : undefined}
        countSuffix="waiting"
      />

      {loading ? (
        <View style={styles.ordersSkeleton}>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </View>
      ) : orders.length === 0 ? (
        <PartnerEmptyState
          ios="fork.knife"
          android="restaurant"
          title="No orders yet today"
          subtitle="List a bag and customers nearby can start reserving"
        />
      ) : (
        <View style={styles.ordersList}>
          {orders.map((order) => (
            <PartnerOrderRow
              key={order.id}
              order={order}
              partnerName={partner?.name}
              onMarkPickedUp={markAsPickedUp}
              onScan={() => router.push('/(tabs)/partner/scan')}
              onOpenChat={(id) => router.push(`/order/chat/${id}`)}
              unreadMessages={unreadByOrder[order.id] ?? 0}
            />
          ))}
        </View>
      )}
      </View>
      </ScrollView>

      {isPendingApproval ? (
        <View style={styles.pendingOverlay}>
          <View style={styles.pendingIconCircle}>
            <Lock size={36} color={Palette.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.pendingTitle}>Awaiting approval</Text>
          <Text style={styles.pendingCopy}>
            Your restaurant is under review. We&apos;ll notify you as soon as you&apos;re approved —
            usually within 24 hours.
          </Text>
          <Pressable
            style={styles.pendingCallButton}
            onPress={() => void Linking.openURL('tel:0405290710')}>
            <Text style={styles.pendingCallButtonText}>Call us: 0405 290 710</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  container: {
    paddingBottom: 120,
  },
  content: {
    paddingTop: Spacing.xs,
  },
  fallback: {
    padding: Spacing.xl,
  },
  headerPlaceholder: {
    backgroundColor: Palette.primaryDark,
    height: 160,
    borderBottomLeftRadius: Radius.lg + 8,
    borderBottomRightRadius: Radius.lg + 8,
  },
  retryWrap: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  ctaSkeleton: {
    height: 88,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceMuted,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  bagsList: {
    gap: 0,
  },
  bagsSkeleton: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm + 2,
  },
  bagSkeletonCard: {
    height: 140,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceMuted,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  addAnother: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 2,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    borderStyle: 'dashed',
    borderColor: Palette.border,
  },
  addAnotherPressed: {
    backgroundColor: Palette.surfaceMuted,
  },
  addAnotherPlus: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.primary,
    lineHeight: 26,
    marginBottom: 2,
  },
  addAnotherText: {
    ...Type.caption,
    color: Palette.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  ordersList: {
    paddingBottom: Spacing.sm,
  },
  ordersSkeleton: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  fallbackTitle: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    zIndex: 50,
  },
  pendingIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  pendingCopy: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
    maxWidth: 300,
  },
  pendingCallButton: {
    marginTop: Spacing.xl,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg + 4,
    paddingVertical: Spacing.md,
  },
  pendingCallButtonText: {
    color: Palette.white,
    ...Type.bodyMedium,
    fontWeight: '700',
  },
});
