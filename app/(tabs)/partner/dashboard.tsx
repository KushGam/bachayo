import { useRouter } from 'expo-router';
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
import { DashboardCtaCard } from '@/components/partner/DashboardCtaCard';
import { buildDashboardStats, DashboardStatsRow } from '@/components/partner/DashboardStatsRow';
import { PartnerEmptyState } from '@/components/partner/PartnerEmptyState';
import { PartnerOrderRow } from '@/components/partner/PartnerOrderRow';
import { PartnerSectionHeader } from '@/components/partner/PartnerSectionHeader';
import { SubscriptionBanner } from '@/components/partner/SubscriptionBanner';
import { NotificationBellBadge } from '@/components/ui/NotificationBellBadge';
import { getCategoryById } from '@/constants/partnerCategories';
import { useAuthStore } from '@/store/useAuthStore';
import { RetryState } from '@/components/ui/RetryState';
import { OrderCardSkeleton, StatsSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';
import {
  formatTodayBilingual,
  getGreeting,
  getTodayIsoDateLocal,
  getYesterdayIsoDateLocal,
} from '@/lib/helpers';
import { hapticButtonPress, hapticSuccess } from '@/lib/haptics';
import { isConfirmedOrderStatus, isReservedOrderStatus, isRevenueOrderStatus } from '@/lib/orderStatus';
import { fetchCustomerOrders, confirmPartnerPickup } from '@/lib/orders';
import { fetchPartnerBagOrders, type PartnerBagOrder } from '@/lib/partnerBags';
import { applyFetchedOrdersWithPickupGuard, isPickupFetchBlocked } from '@/lib/pendingPickups';
import { getPartnerApprovalStatus, type PartnerApprovalFields } from '@/lib/partnerApproval';
import {
  getTrialDaysRemaining,
  type PartnerSubscriptionFields,
} from '@/lib/subscriptions';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import type { PartnerOrderWithCustomer } from '@/types/app';
import type { Partner, RescueBag } from '@/types/database';

function truncateName(name: string, max = 14) {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useAuthStore((s) => s.locale);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [bags, setBags] = useState<RescueBag[]>([]);
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
  const lastPickupTime = useRef(0);

  const today = getTodayIsoDateLocal();
  const yesterday = getYesterdayIsoDateLocal();
  const dates = useMemo(() => formatTodayBilingual(), []);

  const loadData = useCallback(async () => {
    if (isPickupFetchBlocked(lastPickupTime.current)) {
      console.log('[loadData] blocked — pickup just confirmed');
      return;
    }

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
        setPartner(null);
        setBags([]);
        setOrders([]);
        setLoading(false);
        return;
      }

      setPartner(partnerData);

      const [bagsRes, orderRows, statsToday, statsYesterday] = await Promise.all([
        supabase
          .from('rescue_bags')
          .select('*')
          .eq('partner_id', partnerData.id)
          .eq('available_date', today)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        fetchPartnerOrders(partnerData.id, today),
        fetchPartnerDayStats(partnerData.id, today),
        fetchPartnerDayStats(partnerData.id, yesterday),
      ]);

      if (bagsRes.error) throw bagsRes.error;

      setBags(bagsRes.data ?? []);
      setOrders((prev) => applyFetchedOrdersWithPickupGuard(orderRows, new Set(), prev));
      if (!isPickupFetchBlocked(lastPickupTime.current)) {
        setTodayStats(statsToday);
        setYesterdayStats(statsYesterday);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [today, yesterday]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
              callback: () => {
                if (isPickupFetchBlocked(lastPickupTime.current)) return;
                void loadDataRef.current();
              },
            },
            {
              table: 'rescue_bags',
              callback: () => {
                if (isPickupFetchBlocked(lastPickupTime.current)) return;
                void loadDataRef.current();
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

  const activeOrders = orders.filter((o) => isReservedOrderStatus(o.status)).length;

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

      if (isPickupFetchBlocked(lastPickupTime.current)) {
        return;
      }

      setBagOrdersLoading(bagId);
      try {
        const rows = await fetchPartnerBagOrders(bagId);
        setBagOrdersMap((prev) => ({
          ...prev,
          [bagId]: applyFetchedOrdersWithPickupGuard(rows, new Set(), prev[bagId] ?? []),
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
                  Alert.alert('Error', 'Failed to confirm. Please try again.');
                  setMarkingPickup(null);
                  return;
                }

                lastPickupTime.current = Date.now();

                setOrders((prev) =>
                  prev.map((row) =>
                    row.id === orderId
                      ? { ...row, status: 'picked_up', picked_up_at: new Date().toISOString() }
                      : row,
                  ),
                );

                setBagOrdersMap((prev) => {
                  const bagId = order.bag_id;
                  const list = prev[bagId];
                  if (!list) return prev;
                  return {
                    ...prev,
                    [bagId]: list.map((row) =>
                      row.id === orderId
                        ? { ...row, status: 'picked_up', picked_up_at: new Date().toISOString() }
                        : row,
                    ),
                  };
                });

                setTodayStats((prev) => ({
                  ...prev,
                  pickedUp: prev.pickedUp + 1,
                }));

                setMarkingPickup(null);
                void hapticSuccess();
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
      (subscriptionStatus === 'trial' && trialDaysLeft <= 7));

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

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerCopy}>
            {categoryMeta ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {categoryMeta.icon} {locale === 'np' ? categoryMeta.labelNp : categoryMeta.label}
                </Text>
              </View>
            ) : null}
            <Text style={styles.greeting}>
              {getGreeting()}, {truncateName(partner?.name ?? 'there')} 👋
            </Text>
            <Text style={styles.dateEn}>{dates.en}</Text>
          </View>

          <NotificationBellBadge
            variant="dark"
            size={18}
            onPress={() => {
              void hapticButtonPress();
              router.push('/notifications');
            }}
          />
        </View>

        {partner ? <SubscriptionBanner partner={partner} placement="inHeader" /> : null}
      </View>

      {partner && showOverlapBanner ? <SubscriptionBanner partner={partner} placement="overlap" /> : null}

      {loading ? (
        <View style={styles.statsSkeleton}>
          <StatsSkeleton />
        </View>
      ) : (
        <DashboardStatsRow stats={statCards} />
      )}

      {fetchError ? (
        <View style={styles.retryWrap}>
          <RetryState message={fetchError} onRetry={loadData} />
        </View>
      ) : null}

      {partner ? (
        <DashboardCtaCard
          category={partner.category}
          onPress={() => router.push('/partner/add-bag')}
        />
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
          emoji="🛍"
          title="No bags listed today"
          subtitle="Tap the card above to list your first bag"
          dashed
          compact
        />
      ) : (
        <View style={styles.bagsList}>
          {bags.map((bag) => {
            const bagRevenue = orders
              .filter(
                (order) =>
                  order.bag_id === bag.id && isRevenueOrderStatus(order.status),
              )
              .reduce((sum, order) => sum + (order.total_price || 0), 0);

            const bagOrdersForSummary = orders.filter((order) => order.bag_id === bag.id);
            const waitingCustomers = bagOrdersForSummary.filter((order) =>
              isReservedOrderStatus(order.status),
            ).length;
            const confirmedForBag = bagOrdersForSummary.filter((order) =>
              isConfirmedOrderStatus(order.status),
            );

            return (
              <ActiveBagMiniCard
                key={bag.id}
                bag={bag}
                revenueEarned={bagRevenue}
                waitingCustomers={waitingCustomers}
                summaryOrders={bagOrdersMap[bag.id] ?? bagOrdersForSummary}
                summaryFallback={{
                  orderCount: confirmedForBag.length,
                  bagCount: bag.quantity_reserved,
                  revenuePaisa: bagRevenue,
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
            style={styles.addAnother}>
            <Text style={styles.addAnotherPlus}>+</Text>
            <Text style={styles.addAnotherText}>Add another bag</Text>
          </Pressable>
        </View>
      )}

      <PartnerSectionHeader
        title="Orders"
        count={activeOrders}
        countSuffix="reserved"
      />

      {loading ? (
        <View style={styles.ordersSkeleton}>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </View>
      ) : orders.length === 0 ? (
        <PartnerEmptyState
          emoji="🍽"
          emojiInCircle
          title="No orders yet today"
          subtitle={'List a bag and customers\nnearby can start reserving'}
        />
      ) : (
        orders.map((order) => (
          <PartnerOrderRow
            key={order.id}
            order={order}
            partnerName={partner?.name}
            onMarkPickedUp={markAsPickedUp}
            onScan={() => router.push('/(tabs)/partner/scan')}
          />
        ))
      )}
      </ScrollView>

      {isPendingApproval ? (
        <View style={styles.pendingOverlay}>
          <View style={styles.pendingIconCircle}>
            <Text style={styles.pendingIcon}>🔒</Text>
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
    backgroundColor: '#F2F0EB',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F2F0EB',
  },
  container: {
    paddingBottom: 120,
  },
  fallback: {
    padding: Spacing.xl,
  },
  header: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D85A30',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  dateEn: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 3,
    fontWeight: '400',
  },
  statsSkeleton: {
    marginTop: -1,
    marginHorizontal: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#242424',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  retryWrap: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  ctaSkeleton: {
    height: 88,
    borderRadius: 20,
    backgroundColor: '#E8E4DE',
    marginHorizontal: 16,
    marginTop: 16,
  },
  bagsList: {
    gap: 0,
  },
  bagsSkeleton: {
    paddingHorizontal: 16,
    gap: 10,
  },
  bagSkeletonCard: {
    height: 140,
    borderRadius: 16,
    backgroundColor: '#E8E4DE',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  addAnother: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderStyle: 'dashed',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  addAnotherPlus: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D85A30',
    lineHeight: 28,
    marginBottom: 4,
  },
  addAnotherText: {
    fontSize: 13,
    color: '#D85A30',
    fontWeight: '600',
    textAlign: 'center',
  },
  ordersSkeleton: {
    paddingHorizontal: 16,
    gap: 8,
  },
  fallbackTitle: {
    fontSize: 15,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 50,
  },
  pendingIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIcon: {
    fontSize: 48,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 20,
    textAlign: 'center',
  },
  pendingCopy: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  pendingCallButton: {
    marginTop: 24,
    backgroundColor: Palette.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pendingCallButtonText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
