import { CalendarDays, Package, Plus, ShoppingBag, Sparkles } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  AppState,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  PartnerPastBagCard,
  PartnerTodayBagCard,
  RelistCard,
  formatUpcomingDateLabel,
} from '@/components/partner/my-bags/PartnerBagCards';
import { MyBagsHeader, type MyBagsTabKey } from '@/components/partner/my-bags/MyBagsHeader';
import { TodaySummaryCard } from '@/components/partner/my-bags/TodaySummaryCard';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { RetryState } from '@/components/ui/RetryState';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { getTodayIsoDateLocal } from '@/lib/helpers';
import { hapticButtonPress, hapticMedium } from '@/lib/haptics';
import {
  applyBagStockPatch,
  applyReservationToPartnerBag,
  bagToPrefill,
  computePastSummary,
  fetchPartnerBagsForDate,
  fetchPartnerPastBags,
  fetchPartnerUpcomingBags,
  formatNprFromPaisa,
  getYesterdayIso,
  groupPastBags,
  isPartnerBagLiveToday,
  type PartnerBagWithStats,
} from '@/lib/partnerBags';
import { isPickupFetchBlocked, protectPendingPickup } from '@/lib/pendingPickups';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { fetchUnreadCountsByOrder } from '@/lib/orderMessages';
import { supabase } from '@/lib/supabase';
import { useBagPrefillStore, type BagPrefillData } from '@/store/useBagPrefillStore';

type TabKey = MyBagsTabKey;

const QUICK_START_PRESETS: { label: string; prefill: BagPrefillData }[] = [
  {
    label: 'Dal Bhat bag',
    prefill: {
      title: 'Dal Bhat set',
      description: 'Full dal bhat with seasonal sides',
      original_price: 50000,
      rescue_price: 20000,
      quantity_available: 5,
      pickup_start: '12:00',
      pickup_end: '14:00',
    },
  },
  {
    label: 'Dinner set',
    prefill: {
      title: 'Dinner rescue bag',
      description: 'Rice, curry, vegetables, dessert',
      original_price: 70000,
      rescue_price: 30000,
      quantity_available: 5,
      pickup_start: '20:00',
      pickup_end: '22:00',
    },
  },
  {
    label: 'Snack bag',
    prefill: {
      title: 'Morning snack bag',
      description: 'Pastry, sandwich, fruit',
      original_price: 45000,
      rescue_price: 20000,
      quantity_available: 5,
      pickup_start: '07:00',
      pickup_end: '09:00',
    },
  },
  {
    label: 'Bakery mix',
    prefill: {
      title: 'Morning bakes bag',
      description: 'Fresh bread, rolls, croissants',
      original_price: 35000,
      rescue_price: 15000,
      quantity_available: 8,
      pickup_start: '07:00',
      pickup_end: '09:00',
    },
  },
];

function TodayEmptyState({
  onAddBag,
  onQuickStart,
}: {
  onAddBag: () => void;
  onQuickStart: (prefill: BagPrefillData) => void;
}) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyCard}>
        <View style={styles.emptyHeroOuter}>
          <View style={styles.emptyHeroInner}>
            <ShoppingBag size={28} color={Palette.primary} strokeWidth={2} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>Ready to rescue food today?</Text>
        <Text style={styles.emptySubtitle}>
          List surplus in minutes. Nearby customers reserve, pick up, and pay at your counter.
        </Text>

        <View style={styles.emptySteps}>
          {[
            { icon: Sparkles, label: 'Pick a quick-start template' },
            { icon: Package, label: 'Set quantity & pickup window' },
            { icon: ShoppingBag, label: 'Go live for customers nearby' },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <View key={step.label} style={styles.emptyStepRow}>
                <View style={styles.emptyStepIndex}>
                  <Text style={styles.emptyStepIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.emptyStepIcon}>
                  <Icon size={14} color={Palette.primaryDark} strokeWidth={2.2} />
                </View>
                <Text style={styles.emptyStepLabel}>{step.label}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.quickStartLabel}>Quick start</Text>
        <View style={styles.quickStartGrid}>
          {QUICK_START_PRESETS.slice(0, 4).map((preset) => (
            <Pressable
              key={preset.label}
              onPress={() => onQuickStart(preset.prefill)}
              style={({ pressed }) => [styles.quickStartPill, pressed && styles.quickStartPillPressed]}>
              <Text style={styles.quickStartPillText}>{preset.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onAddBag}
          style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}>
          <Plus size={18} color={Palette.white} strokeWidth={2.5} />
          <Text style={styles.emptyCtaText}>Create custom bag</Text>
        </Pressable>
      </View>
    </View>
  );
}

function UpcomingEmptyState({ onAddBag }: { onAddBag: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyCard}>
        <View style={styles.emptyHeroOuter}>
          <View style={styles.emptyHeroInner}>
            <CalendarDays size={28} color={Palette.primary} strokeWidth={2} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>Nothing scheduled ahead</Text>
        <Text style={styles.emptySubtitle}>
          Plan tomorrow or later this week so customers can reserve before the day starts.
        </Text>
        <Pressable
          onPress={onAddBag}
          style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}>
          <Plus size={18} color={Palette.white} strokeWidth={2.5} />
          <Text style={styles.emptyCtaText}>Schedule a bag</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PastEmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyCard}>
        <View style={[styles.emptyHeroOuter, styles.emptyHeroMuted]}>
          <View style={styles.emptyHeroInner}>
            <Package size={28} color={Palette.textSecondary} strokeWidth={1.8} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>No past bags yet</Text>
        <Text style={styles.emptySubtitle}>
          After your first day of listings, sold, missed, and expired bags show up here.
        </Text>
      </View>
    </View>
  );
}

function PastSummaryCard({ bags }: { bags: PartnerBagWithStats[] }) {
  const summary = computePastSummary(bags);
  const stats = [
    { value: String(summary.listed), label: 'Listed' },
    { value: String(summary.sold), label: 'Sold' },
    { value: formatNprFromPaisa(summary.earned), label: 'Earned', accent: true },
  ];

  return (
    <View style={styles.pastSummaryCard}>
      <View style={styles.pastSummaryHeader}>
        <View style={styles.headerAccent} />
        <Text style={styles.pastSummaryTitle}>Last 30 days</Text>
      </View>
      <View style={styles.pastSummaryRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.pastSummaryStat}>
            <Text
              style={[styles.pastSummaryValue, stat.accent && styles.pastSummaryValueAccent]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}>
              {stat.value}
            </Text>
            <Text style={styles.pastSummaryLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function PartnerMyBagsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = getTodayIsoDateLocal();
  const yesterday = getYesterdayIso(today);

  const [tab, setTab] = useState<TabKey>('today');
  const [todayBags, setTodayBags] = useState<PartnerBagWithStats[]>([]);
  const [upcomingBags, setUpcomingBags] = useState<PartnerBagWithStats[]>([]);
  const [pastBags, setPastBags] = useState<PartnerBagWithStats[]>([]);
  const [yesterdayBags, setYesterdayBags] = useState<PartnerBagWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showFab, setShowFab] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [reactivationToast, setReactivationToast] = useState(false);
  const [soldOutToast, setSoldOutToast] = useState(false);
  const [showFabHint, setShowFabHint] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [unreadByOrder, setUnreadByOrder] = useState<Record<string, number>>({});
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const lastPickupTime = useRef(0);
  const pendingPickupIds = useRef(new Set<string>());
  const loadGeneration = useRef(0);

  const isFirstLoad = useRef(true);
  const bagsCacheRef = useRef<{
    today: PartnerBagWithStats[];
    upcoming: PartnerBagWithStats[];
    past: PartnerBagWithStats[];
    yesterday: PartnerBagWithStats[];
  } | null>(null);
  const lastScrollY = useRef(0);
  const fabOpacity = useSharedValue(1);
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);

  const fabStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
    transform: [{ scale: fabScale.value * fabOpacity.value }],
  }));

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }],
  }));

  const liveTodayBags = useMemo(
    () => todayBags.filter(isPartnerBagLiveToday),
    [todayBags],
  );
  const finishedTodayBags = useMemo(
    () => todayBags.filter((bag) => !isPartnerBagLiveToday(bag)),
    [todayBags],
  );

  useEffect(() => {
    if (tab === 'today' && liveTodayBags.length === 0 && !loading) {
      setShowFabHint(true);
      const timer = setTimeout(() => setShowFabHint(false), 3000);
      return () => clearTimeout(timer);
    }
    setShowFabHint(false);
  }, [tab, liveTodayBags.length, loading]);

  const handleFabPress = () => {
    void hapticMedium();
    fabScale.value = withSpring(1.15, { damping: 8, stiffness: 300 }, () => {
      fabScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
    fabRotation.value = withSequence(
      withTiming(45, { duration: 100 }),
      withTiming(0, { duration: 0 }),
    );
    router.push('/partner/add-bag');
  };

  const setPrefill = useBagPrefillStore((s) => s.setPrefill);

  const handleRelist = useCallback(
    (bag: PartnerBagWithStats) => {
      void hapticButtonPress();
      setPrefill(bagToPrefill(bag));
      router.push('/partner/add-bag');
    },
    [router, setPrefill],
  );

  const handleQuickStart = useCallback(
    (prefill: BagPrefillData) => {
      void hapticButtonPress();
      setPrefill(prefill);
      router.push('/partner/add-bag');
    },
    [router, setPrefill],
  );

  const handleBagDeleted = useCallback((bagId: string) => {
    setTodayBags((current) => current.filter((bag) => bag.id !== bagId));
    setUpcomingBags((current) => current.filter((bag) => bag.id !== bagId));
  }, []);

  const handlePickupConfirmed = useCallback((bagId: string, order: { quantity?: number; total_price: number }) => {
    const patchBag = (bag: PartnerBagWithStats) => {
      if (bag.id !== bagId) return bag;
      const qty = order.quantity ?? 1;
      const pickedBags = bag.picked_up_bags + qty;
      const occupied = Math.max(bag.quantity_reserved, pickedBags);
      return {
        ...bag,
        quantity_reserved: occupied,
        reserved_orders: Math.max(0, bag.reserved_orders - 1),
        confirmed_orders: Math.max(0, bag.confirmed_orders - 1),
        picked_up_orders: bag.picked_up_orders + 1,
        picked_up_bags: pickedBags,
        potential_revenue: Math.max(0, bag.potential_revenue - order.total_price),
        revenue_earned: bag.revenue_earned + order.total_price,
        status:
          bag.quantity_available > 0 && occupied >= bag.quantity_available
            ? 'sold_out'
            : bag.status,
      };
    };

    setTodayBags((current) => current.map(patchBag));
    setUpcomingBags((current) => current.map(patchBag));
  }, []);

  const loadBags = useCallback(async () => {
    setErrorText(null);
    const generation = ++loadGeneration.current;

    if (bagsCacheRef.current) {
      setTodayBags(bagsCacheRef.current.today);
      setUpcomingBags(bagsCacheRef.current.upcoming);
      setPastBags(bagsCacheRef.current.past);
      setYesterdayBags(bagsCacheRef.current.yesterday);
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data: partnerData } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!partnerData) {
        if (generation !== loadGeneration.current) return;
        setPartnerId(null);
        setTodayBags([]);
        setUpcomingBags([]);
        setPastBags([]);
        setYesterdayBags([]);
        setLoading(false);
        return;
      }

      setPartnerId(partnerData.id);

      const [todayRows, upcomingRows, pastRows, yesterdayRows] = await Promise.all([
        fetchPartnerBagsForDate(partnerData.id, today),
        fetchPartnerUpcomingBags(partnerData.id, today),
        fetchPartnerPastBags(partnerData.id, today),
        fetchPartnerBagsForDate(partnerData.id, yesterday),
      ]);

      if (generation !== loadGeneration.current) return;

      setTodayBags(todayRows);
      setUpcomingBags(upcomingRows);
      setPastBags(pastRows);
      setYesterdayBags(yesterdayRows);
      bagsCacheRef.current = {
        today: todayRows,
        upcoming: upcomingRows,
        past: pastRows,
        yesterday: yesterdayRows,
      };
      setOrdersRefreshKey((key) => key + 1);

      const { data: partnerOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('partner_id', partnerData.id);
      if (generation !== loadGeneration.current) return;

      const counts = await fetchUnreadCountsByOrder(
        (partnerOrders ?? []).map((row) => row.id),
        userId,
      );
      if (generation !== loadGeneration.current) return;
      setUnreadByOrder(counts);
    } catch (err) {
      if (generation !== loadGeneration.current) return;
      setErrorText(err instanceof Error ? err.message : 'Failed to load bags');
    } finally {
      if (generation === loadGeneration.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
    }
  }, [today, yesterday]);

  useEffect(() => {
    void loadBags();
  }, [loadBags]);

  useFocusEffect(
    useCallback(() => {
      if (!isFirstLoad.current) {
        void loadBags();
      }
    }, [loadBags]),
  );

  const loadBagsRef = useRef(loadBags);
  const todayBagsRef = useRef(todayBags);
  const upcomingBagsRef = useRef(upcomingBags);
  loadBagsRef.current = loadBags;
  todayBagsRef.current = todayBags;
  upcomingBagsRef.current = upcomingBags;

  useEffect(() => {
    if (!partnerId) return;

    const channelName = `partner-my-bags-${partnerId}`;
    let cancelled = false;

    const patchAllBagLists = (patch: (bag: PartnerBagWithStats) => PartnerBagWithStats) => {
      setTodayBags((prev) => prev.map(patch));
      setUpcomingBags((prev) => prev.map(patch));
      setPastBags((prev) => prev.map(patch));
      setYesterdayBags((prev) => prev.map(patch));
      if (bagsCacheRef.current) {
        bagsCacheRef.current = {
          today: bagsCacheRef.current.today.map(patch),
          upcoming: bagsCacheRef.current.upcoming.map(patch),
          past: bagsCacheRef.current.past.map(patch),
          yesterday: bagsCacheRef.current.yesterday.map(patch),
        };
      }
    };

    const refreshUnread = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId || cancelled) return;
      const { data: partnerOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('partner_id', partnerId);
      if (cancelled) return;
      const counts = await fetchUnreadCountsByOrder(
        (partnerOrders ?? []).map((row) => row.id),
        userId,
      );
      if (!cancelled) setUnreadByOrder(counts);
    };

    void (async () => {
      try {
        await subscribePostgresChannel(
          supabase,
          channelName,
          [
            {
              event: '*',
              table: 'rescue_bags',
              filter: `partner_id=eq.${partnerId}`,
              callback: (payload) => {
                const eventType = (payload as { eventType?: string }).eventType;
                const newRow = (payload as {
                  new?: {
                    id?: string;
                    status?: PartnerBagWithStats['status'];
                    quantity_reserved?: number;
                    quantity_available?: number;
                    available_date?: string;
                  };
                }).new;

                if (newRow?.status === 'active' && newRow.id) {
                  const wasSoldOut = [...todayBagsRef.current, ...upcomingBagsRef.current].some(
                    (bag) => bag.id === newRow.id && bag.status === 'sold_out',
                  );
                  if (wasSoldOut) setReactivationToast(true);
                }

                if (
                  eventType === 'UPDATE' &&
                  newRow?.id &&
                  (newRow.quantity_reserved != null ||
                    newRow.quantity_available != null ||
                    newRow.status)
                ) {
                  patchAllBagLists((bag) =>
                    bag.id === newRow.id
                      ? applyBagStockPatch(bag, {
                          quantity_reserved: newRow.quantity_reserved,
                          quantity_available: newRow.quantity_available,
                          status: newRow.status,
                        })
                      : bag,
                  );
                }

                // INSERT / DELETE / date moves need a full reload across tabs
                void loadBagsRef.current();
              },
            },
            {
              event: 'INSERT',
              table: 'orders',
              filter: `partner_id=eq.${partnerId}`,
              callback: (payload) => {
                if (isPickupFetchBlocked(lastPickupTime.current)) return;

                const inserted = (payload as {
                  new?: {
                    bag_id?: string;
                    quantity?: number;
                    status?: string;
                    total_price?: number;
                  };
                }).new;

                if (inserted?.bag_id) {
                  const bagId = inserted.bag_id;
                  const qty = inserted.quantity ?? 1;
                  const status = inserted.status ?? 'confirmed';
                  const total = inserted.total_price ?? 0;
                  patchAllBagLists((bag) =>
                    bag.id === bagId
                      ? applyReservationToPartnerBag(bag, qty, status, total)
                      : bag,
                  );
                }

                void loadBagsRef.current();
              },
            },
            {
              event: 'UPDATE',
              table: 'orders',
              filter: `partner_id=eq.${partnerId}`,
              callback: () => {
                if (isPickupFetchBlocked(lastPickupTime.current)) return;
                void loadBagsRef.current();
              },
            },
            {
              event: '*',
              table: 'order_messages',
              callback: () => {
                void refreshUnread();
              },
            },
          ],
          () => cancelled,
        );
      } catch (error) {
        if (!cancelled) {
          console.warn('[partner-my-bags] realtime subscribe failed:', error);
        }
      }
    })();

    const appSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void loadBagsRef.current();
      }
    });

    return () => {
      cancelled = true;
      appSub.remove();
      void removeChannelByName(supabase, channelName);
    };
  }, [partnerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBags();
    setRefreshing(false);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y > lastScrollY.current + 10 && y > 60) {
      if (showFab) {
        setShowFab(false);
        fabOpacity.value = withTiming(0, { duration: 200 });
      }
    } else if (y < lastScrollY.current - 10) {
      if (!showFab) {
        setShowFab(true);
        fabOpacity.value = withTiming(1, { duration: 200 });
      }
    }
    lastScrollY.current = y;
  };

  const pastGroups = useMemo(() => groupPastBags(pastBags, today), [pastBags, today]);

  const upcomingByDate = useMemo(() => {
    const map = new Map<string, PartnerBagWithStats[]>();
    for (const bag of upcomingBags) {
      const list = map.get(bag.available_date) ?? [];
      list.push(bag);
      map.set(bag.available_date, list);
    }
    return Array.from(map.entries());
  }, [upcomingBags]);

  const handleToggleOrders = useCallback((bagId: string) => {
    setExpandedOrderId((current) => (current === bagId ? null : bagId));
  }, []);

  const renderTabContent = () => {
    if (isFirstLoad.current && loading) {
      return (
        <View style={styles.skeletonWrap}>
          <ListSkeleton count={3} />
        </View>
      );
    }

    if (errorText) {
      return (
        <View style={styles.errorWrap}>
          <RetryState message={errorText} onRetry={loadBags} />
        </View>
      );
    }

    if (tab === 'today') {
      if (liveTodayBags.length === 0 && finishedTodayBags.length === 0) {
        return (
          <TodayEmptyState
            onAddBag={() => {
              void hapticButtonPress();
              router.push('/partner/add-bag');
            }}
            onQuickStart={handleQuickStart}
          />
        );
      }

      return (
        <>
          <TodaySummaryCard bags={todayBags} />
          {liveTodayBags.map((bag) => (
            <PartnerTodayBagCard
              key={bag.id}
              bag={bag}
              isOrdersExpanded={expandedOrderId === bag.id}
              onToggleOrders={handleToggleOrders}
              lastPickupTimeRef={lastPickupTime}
              pendingPickupIdsRef={pendingPickupIds}
              onPickupConfirmed={(order) => handlePickupConfirmed(bag.id, order)}
              onRefresh={loadBags}
              onRelist={() => handleRelist(bag)}
              onSoldOut={() => setSoldOutToast(true)}
              onDeleted={handleBagDeleted}
              onOpenChat={(orderId) => router.push(`/order/chat/${orderId}`)}
              unreadByOrder={unreadByOrder}
              ordersRefreshKey={ordersRefreshKey}
            />
          ))}
          {liveTodayBags.length === 0 ? (
            <View style={styles.finishedBanner}>
              <Text style={styles.finishedBannerTitle}>Nothing live right now</Text>
              <Text style={styles.finishedBannerText}>
                Today’s finished bags are below — relist anytime for tomorrow.
              </Text>
            </View>
          ) : null}
          {finishedTodayBags.length > 0 ? (
            <View style={styles.finishedSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.headerAccent} />
                <Text style={styles.relistSectionTitle}>Finished today</Text>
              </View>
              {finishedTodayBags.map((bag) => (
                <PartnerPastBagCard
                  key={bag.id}
                  bag={bag}
                  onRelist={() => handleRelist(bag)}
                  isOrdersExpanded={expandedOrderId === bag.id}
                  onToggleOrders={handleToggleOrders}
                  ordersRefreshKey={ordersRefreshKey}
                />
              ))}
            </View>
          ) : null}
        </>
      );
    }

    if (tab === 'upcoming') {
      return (
        <>
          {yesterdayBags.length > 0 ? (
            <View style={styles.relistSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.headerAccent} />
                <Text style={styles.relistSectionTitle}>Relist from yesterday</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relistScroll}>
                {yesterdayBags.map((bag) => (
                  <RelistCard key={bag.id} bag={bag} onRelist={() => handleRelist(bag)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {upcomingBags.length === 0 ? (
            <UpcomingEmptyState
              onAddBag={() => {
                void hapticButtonPress();
                router.push('/partner/add-bag');
              }}
            />
          ) : (
            upcomingByDate.map(([date, bags]) =>
              bags.map((bag) => (
                <PartnerTodayBagCard
                  key={bag.id}
                  bag={bag}
                  dateLabel={formatUpcomingDateLabel(date)}
                  isOrdersExpanded={expandedOrderId === bag.id}
                  onToggleOrders={handleToggleOrders}
                  lastPickupTimeRef={lastPickupTime}
                  pendingPickupIdsRef={pendingPickupIds}
                  onPickupConfirmed={(order) => handlePickupConfirmed(bag.id, order)}
                  onRefresh={loadBags}
                  onRelist={() => handleRelist(bag)}
                  onSoldOut={() => setSoldOutToast(true)}
                  onDeleted={handleBagDeleted}
                  onOpenChat={(orderId) => router.push(`/order/chat/${orderId}`)}
                  unreadByOrder={unreadByOrder}
                  ordersRefreshKey={ordersRefreshKey}
                />
              )),
            )
          )}
        </>
      );
    }

    if (pastBags.length === 0) {
      return <PastEmptyState />;
    }

    return (
      <>
        <PastSummaryCard bags={pastBags} />
        {pastGroups.map((group) => (
          <View key={group.label}>
            <Text style={styles.pastGroupHeader}>{group.label}</Text>
            {group.bags.map((bag) => (
              <PartnerPastBagCard
                key={bag.id}
                bag={bag}
                onRelist={() => handleRelist(bag)}
                isOrdersExpanded={expandedOrderId === bag.id}
                onToggleOrders={handleToggleOrders}
                ordersRefreshKey={ordersRefreshKey}
              />
            ))}
          </View>
        ))}
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <MyBagsHeader
        tab={tab}
        paddingTop={insets.top + Spacing.sm}
        todayCount={liveTodayBags.length}
        upcomingCount={upcomingBags.length}
        pastCount={pastBags.length}
        onTabChange={setTab}
        onAddBag={() => router.push('/partner/add-bag')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      <Animated.View
        style={[
          styles.fab,
          { bottom: insets.bottom + 16 },
          fabStyle,
        ]}
        pointerEvents={showFab ? 'auto' : 'none'}>
        {showFabHint && tab === 'today' && liveTodayBags.length === 0 ? (
          <View style={styles.fabHint}>
            <Text style={styles.fabHintText}>Add bag</Text>
          </View>
        ) : null}
        <Pressable onPress={handleFabPress} style={styles.fabBtn}>
          <Animated.View style={fabIconStyle}>
            <Plus size={26} color={Palette.white} strokeWidth={2.5} />
          </Animated.View>
        </Pressable>
      </Animated.View>

      <SuccessToast
        visible={reactivationToast}
        title="A customer cancelled — your bag is active again!"
        onHide={() => setReactivationToast(false)}
      />
      <SuccessToast
        visible={soldOutToast}
        title="Marked as sold out"
        onHide={() => setSoldOutToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  scroll: { flex: 1, backgroundColor: Palette.background },
  skeletonWrap: { paddingTop: Spacing.lg },
  errorWrap: { padding: Spacing.lg },
  relistSection: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  finishedSection: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  finishedBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    padding: Spacing.md,
    gap: 4,
  },
  finishedBannerTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  finishedBannerText: {
    ...Type.caption,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 2,
  },
  headerAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
  relistSectionTitle: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  relistScroll: { paddingHorizontal: Spacing.lg, paddingBottom: 4 },
  pastSummaryCard: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 20,
    padding: Spacing.md,
    ...FloatingShadow,
  },
  pastSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  pastSummaryTitle: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  pastSummaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pastSummaryStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  pastSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  pastSummaryValueAccent: {
    color: Palette.primary,
  },
  pastSummaryLabel: {
    ...Type.label,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  pastGroupHeader: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  emptyWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  emptyCard: {
    ...CardChrome,
    backgroundColor: Palette.surface,
    borderRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    ...FloatingShadow,
  },
  emptyHeroOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyHeroMuted: {
    backgroundColor: Palette.background,
  },
  emptyHeroInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 21,
    maxWidth: 300,
  },
  emptySteps: {
    alignSelf: 'stretch',
    marginTop: Spacing.xl,
    gap: 10,
  },
  emptyStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.background,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  emptyStepIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStepIndexText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyStepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStepLabel: {
    flex: 1,
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  quickStartLabel: {
    alignSelf: 'stretch',
    ...Type.label,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  quickStartGrid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickStartPill: {
    backgroundColor: Palette.background,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickStartPillPressed: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
  },
  quickStartPillText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  emptyCta: {
    marginTop: Spacing.xl,
    alignSelf: 'stretch',
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyCtaText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '700',
  },
  pressed: { opacity: 0.92 },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  fabHint: {
    backgroundColor: 'rgba(28,25,23,0.88)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  fabHintText: {
    color: Palette.white,
    ...Type.caption,
    fontWeight: '600',
  },
  fabBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...FloatingShadow,
  },
});
