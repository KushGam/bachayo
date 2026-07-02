import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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
import { ListSkeleton } from '@/components/ui/Skeleton';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { RetryState } from '@/components/ui/RetryState';
import { getTodayIsoDateLocal } from '@/lib/helpers';
import { hapticButtonPress, hapticMedium } from '@/lib/haptics';
import {
  bagToPrefill,
  computePastSummary,
  computeTodaySummary,
  fetchPartnerBagsForDate,
  fetchPartnerPastBags,
  fetchPartnerUpcomingBags,
  formatNprFromPaisa,
  getYesterdayIso,
  groupPastBags,
  type PartnerBagWithStats,
} from '@/lib/partnerBags';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import { useBagPrefillStore, type BagPrefillData } from '@/store/useBagPrefillStore';

type TabKey = 'today' | 'upcoming' | 'past';

const TERRACOTTA = '#D85A30';
const BG = '#F5F3EF';
const TEXT_SECONDARY = '#6B7280';

const QUICK_START_PRESETS: { label: string; prefill: BagPrefillData }[] = [
  {
    label: '🍛 Dal Bhat bag',
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
    label: '🍽 Dinner set',
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
    label: '☕ Snack bag',
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
    label: '🥐 Bakery mix',
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

const TAB_LABELS: Record<TabKey, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  past: 'Past',
};

function TodaySummaryPills({ bags }: { bags: PartnerBagWithStats[] }) {
  const summary = computeTodaySummary(bags);
  const pills = [
    { emoji: '🛍', value: String(summary.listed), label: 'Listed' },
    { emoji: '✓', value: String(summary.reserved), label: 'Reserved' },
    { emoji: '₨', value: formatNprFromPaisa(summary.potentialRevenue).replace('₨ ', ''), label: 'Revenue' },
  ];

  return (
    <View style={styles.summaryRow}>
      {pills.map((pill) => (
        <View key={pill.label} style={styles.summaryPill}>
          <Text style={styles.summaryValue}>
            {pill.emoji === '₨' ? `₨ ${pill.value}` : pill.value}
          </Text>
          <Text style={styles.summaryLabel}>
            {pill.emoji === '₨' ? 'Revenue' : `${pill.emoji} ${pill.label}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TodayEmptyState({
  onAddBag,
  onQuickStart,
}: {
  onAddBag: () => void;
  onQuickStart: (prefill: BagPrefillData) => void;
}) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [floatY]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyCircle}>
        <Animated.Text style={[styles.emptyEmoji, floatStyle]}>🛍</Animated.Text>
      </View>
      <Text style={styles.emptyTitle}>Ready to rescue food today?</Text>
      <Text style={styles.emptySubtitle}>
        List your surplus and customers{'\n'}nearby can start reserving in minutes
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickStartRow}>
        {QUICK_START_PRESETS.map((preset) => (
          <Pressable
            key={preset.label}
            onPress={() => onQuickStart(preset.prefill)}
            style={styles.quickStartPill}>
            <Text style={styles.quickStartPillText}>{preset.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable onPress={onAddBag} hitSlop={8}>
        <Text style={styles.emptyLink}>Or add a custom bag →</Text>
      </Pressable>
    </View>
  );
}

function PastSummaryCard({ bags }: { bags: PartnerBagWithStats[] }) {
  const summary = computePastSummary(bags);
  const stats = [
    { value: String(summary.listed), label: 'Total bags listed' },
    { value: String(summary.sold), label: 'Total sold' },
    { value: formatNprFromPaisa(summary.earned), label: 'Total earned' },
  ];

  return (
    <View style={styles.pastSummaryCard}>
      <Text style={styles.pastSummaryTitle}>Last 30 days</Text>
      <View style={styles.pastSummaryRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.pastSummaryStat}>
            <Text style={styles.pastSummaryValue}>{stat.value}</Text>
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

  useEffect(() => {
    if (tab === 'today' && todayBags.length === 0 && !loading) {
      setShowFabHint(true);
      const timer = setTimeout(() => setShowFabHint(false), 3000);
      return () => clearTimeout(timer);
    }
    setShowFabHint(false);
  }, [tab, todayBags.length, loading]);

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

  const loadBags = useCallback(async () => {
    setErrorText(null);
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

      setTodayBags(todayRows);
      setUpcomingBags(upcomingRows);
      setPastBags(pastRows);
      setYesterdayBags(yesterdayRows);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to load bags');
    } finally {
      setLoading(false);
    }
  }, [today, yesterday]);

  useEffect(() => {
    void loadBags();
  }, [loadBags]);

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

    void (async () => {
      try {
        await subscribePostgresChannel(
          supabase,
          channelName,
          [
            {
              event: 'UPDATE',
              table: 'rescue_bags',
              filter: `partner_id=eq.${partnerId}`,
              callback: (payload) => {
                const newRow = (payload as { new?: { id?: string; status?: string } }).new;
                if (newRow?.status === 'active' && newRow.id) {
                  const wasSoldOut = [...todayBagsRef.current, ...upcomingBagsRef.current].some(
                    (bag) => bag.id === newRow.id && bag.status === 'sold_out',
                  );
                  if (wasSoldOut) {
                    setReactivationToast(true);
                  }
                }
                void loadBagsRef.current();
              },
            },
            {
              table: 'orders',
              filter: `partner_id=eq.${partnerId}`,
              callback: () => {
                void loadBagsRef.current();
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

    return () => {
      cancelled = true;
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

  const renderTabContent = () => {
    if (loading) {
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
      if (todayBags.length === 0) {
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
          <TodaySummaryPills bags={todayBags} />
          {todayBags.map((bag) => (
            <PartnerTodayBagCard
              key={bag.id}
              bag={bag}
              onRefresh={loadBags}
              onRelist={() => handleRelist(bag)}
              onSoldOut={() => setSoldOutToast(true)}
              onDeleted={handleBagDeleted}
            />
          ))}
        </>
      );
    }

    if (tab === 'upcoming') {
      return (
        <>
          {yesterdayBags.length > 0 ? (
            <View style={styles.relistSection}>
              <Text style={styles.relistSectionTitle}>Relist from yesterday</Text>
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
            <View style={styles.upcomingEmpty}>
              <Text style={styles.upcomingEmptyTitle}>No upcoming bags scheduled</Text>
              <Text style={styles.upcomingEmptySubtitle}>
                Use Relist above to quickly add today&apos;s bag,{'\n'}or add a new one with the + button
              </Text>
            </View>
          ) : (
            upcomingByDate.map(([date, bags]) =>
              bags.map((bag) => (
                <PartnerTodayBagCard
                  key={bag.id}
                  bag={bag}
                  dateLabel={formatUpcomingDateLabel(date)}
                  onRefresh={loadBags}
                  onRelist={() => handleRelist(bag)}
                  onSoldOut={() => setSoldOutToast(true)}
                  onDeleted={handleBagDeleted}
                />
              )),
            )
          )}
        </>
      );
    }

    if (pastBags.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No past bags yet</Text>
          <Text style={styles.emptySubtitle}>
            Your listing history will appear here{'\n'}after your first day of listings
          </Text>
        </View>
      );
    }

    return (
      <>
        <PastSummaryCard bags={pastBags} />
        {pastGroups.map((group) => (
          <View key={group.label}>
            <Text style={styles.pastGroupHeader}>{group.label}</Text>
            {group.bags.map((bag) => (
              <PartnerPastBagCard key={bag.id} bag={bag} onRelist={() => handleRelist(bag)} />
            ))}
          </View>
        ))}
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
          },
        ]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Bags</Text>
          <Pressable
            onPress={() => {
              void hapticButtonPress();
              router.push('/partner/add-bag');
            }}
            style={styles.headerAddBtn}
            hitSlop={8}>
            <Text style={styles.headerAddText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.tabBar}>
          {(['today', 'upcoming', 'past'] as TabKey[]).map((key) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  void hapticButtonPress();
                  setTab(key);
                }}
                style={styles.tabSlot}>
                {active ? (
                  <Animated.View layout={Layout.duration(200)} style={styles.tabActive}>
                    <Text style={styles.tabTextActive}>{TAB_LABELS[key]}</Text>
                  </Animated.View>
                ) : (
                  <View style={styles.tabInactive}>
                    <Text style={styles.tabTextInactive}>{TAB_LABELS[key]}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TERRACOTTA} />
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
        {showFabHint && tab === 'today' && todayBags.length === 0 ? (
          <View style={styles.fabHint}>
            <Text style={styles.fabHintText}>Add bag</Text>
          </View>
        ) : null}
        <Pressable onPress={handleFabPress} style={styles.fabBtn}>
          <Animated.Text style={[styles.fabText, fabIconStyle]}>+</Animated.Text>
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
  screen: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: TERRACOTTA,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddText: { fontSize: 22, color: '#FFFFFF', lineHeight: 24, marginTop: -1 },
  tabBar: {
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 999,
    padding: 3,
    flexDirection: 'row',
  },
  tabSlot: { flex: 1 },
  tabActive: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabInactive: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTextActive: { fontSize: 13, fontWeight: '600', color: TERRACOTTA },
  tabTextInactive: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  scroll: { flex: 1, backgroundColor: BG },
  skeletonWrap: { paddingTop: 16 },
  errorWrap: { padding: 16 },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryValue: { fontSize: 18, fontWeight: '600', color: TERRACOTTA },
  summaryLabel: { fontSize: 12, color: TEXT_SECONDARY, textAlign: 'center' },
  relistSection: { marginTop: 16 },
  relistSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  relistScroll: { paddingHorizontal: 16, paddingBottom: 4 },
  upcomingEmpty: { paddingVertical: 40, paddingHorizontal: 24 },
  upcomingEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  upcomingEmptySubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  pastSummaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
  },
  pastSummaryTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  pastSummaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pastSummaryStat: { flex: 1, alignItems: 'center' },
  pastSummaryValue: { fontSize: 20, fontWeight: '600', color: TERRACOTTA },
  pastSummaryLabel: { fontSize: 11, color: TEXT_SECONDARY, textAlign: 'center', marginTop: 4 },
  pastGroupHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  quickStartRow: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  quickStartPill: {
    backgroundColor: '#FAECE7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  quickStartPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#993C1D',
  },
  emptyLink: {
    fontSize: 14,
    fontWeight: '600',
    color: TERRACOTTA,
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fabHint: {
    backgroundColor: 'rgba(26,26,26,0.8)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fabHintText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  fabBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TERRACOTTA,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TERRACOTTA,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, lineHeight: 30, marginTop: -2 },
});
