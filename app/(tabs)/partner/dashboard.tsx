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
import { hapticButtonPress } from '@/lib/haptics';
import { isReservedOrderStatus } from '@/lib/orderStatus';
import { fetchPartnerDayStats, fetchPartnerOrders } from '@/lib/orders';
import { getTrialDaysRemaining, type PartnerSubscriptionFields } from '@/lib/subscriptions';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import type { PartnerOrderWithCustomer } from '@/types/app';
import type { Partner, RescueBag } from '@/types/database';

function truncateName(name: string, max = 15) {
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
      setOrders(orderRows);
      setTodayStats(statsToday);
      setYesterdayStats(statsYesterday);
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
              table: 'orders',
              callback: () => {
                void loadDataRef.current();
              },
            },
            {
              table: 'rescue_bags',
              callback: () => {
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

  const handleOrderPickedUp = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: 'picked_up', picked_up_at: new Date().toISOString() }
          : order,
      ),
    );
    void loadDataRef.current();
  }, []);
  const categoryMeta = partner ? getCategoryById(partner.category) : null;

  const subscriptionStatus =
    (partner as (Partner & PartnerSubscriptionFields) | null)?.subscription_status ?? 'trial';
  const trialDaysLeft = getTrialDaysRemaining(
    (partner as (Partner & PartnerSubscriptionFields) | null)?.trial_ends_at,
  );
  const showOverlapBanner =
    partner &&
    (subscriptionStatus === 'past_due' ||
      subscriptionStatus === 'paused' ||
      (subscriptionStatus === 'trial' && trialDaysLeft <= 7));

  if (!loading && !partner) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.fallback}>
        <StatusBar style="dark" />
        <Text style={styles.fallbackTitle}>Complete onboarding to access your dashboard.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
      }>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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
        <View style={[styles.statsSkeleton, showOverlapBanner && styles.statsSkeletonOverlap]}>
          <StatsSkeleton />
        </View>
      ) : (
        <View style={showOverlapBanner ? styles.statsOverlapOffset : undefined}>
          <DashboardStatsRow stats={statCards} />
        </View>
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
        count={bags.length}
        actionLabel={bags.length > 0 ? 'Manage' : undefined}
        onAction={bags.length > 0 ? () => router.push('/(tabs)/partner/my-bags') : undefined}
      />

      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          <View style={styles.miniSkeleton} />
          <View style={styles.miniSkeleton} />
        </ScrollView>
      ) : bags.length === 0 ? (
        <PartnerEmptyState
          emoji="🛍"
          title="No bags listed today"
          subtitle="Tap the card above to list your first bag"
          dashed
          compact
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {bags.map((bag) => (
            <ActiveBagMiniCard key={bag.id} bag={bag} />
          ))}
          <Pressable
            onPress={() => {
              void hapticButtonPress();
              router.push('/partner/add-bag');
            }}
            style={styles.addAnother}>
            <Text style={styles.addAnotherPlus}>+</Text>
            <Text style={styles.addAnotherText}>Add another bag</Text>
          </Pressable>
        </ScrollView>
      )}

      <PartnerSectionHeader
        title="Orders"
        count={activeOrders > 0 ? activeOrders : undefined}
        countSuffix={activeOrders === 1 ? 'active' : 'active'}
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
            onPickupComplete={loadData}
            onOrderPickedUp={handleOrderPickedUp}
            onScan={() => router.push('/(tabs)/partner/scan')}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  container: {
    paddingBottom: 100,
  },
  fallback: {
    padding: Spacing.xl,
  },
  header: {
    backgroundColor: Palette.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 28,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: Palette.white,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.white,
    lineHeight: 26,
  },
  dateEn: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 8,
    fontWeight: '500',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Palette.primary,
  },
  statsOverlapOffset: {
    marginTop: 12,
  },
  statsSkeleton: {
    marginHorizontal: 16,
    marginTop: -20,
  },
  statsSkeletonOverlap: {
    marginTop: 12,
  },
  retryWrap: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  ctaSkeleton: {
    height: 88,
    borderRadius: 20,
    backgroundColor: Palette.imagePlaceholder,
    marginHorizontal: 16,
    marginTop: 16,
  },
  hScroll: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  miniSkeleton: {
    width: 168,
    height: 150,
    borderRadius: 16,
    backgroundColor: Palette.imagePlaceholder,
    marginRight: 10,
  },
  addAnother: {
    width: 120,
    minHeight: 150,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0EDE8',
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginRight: 16,
  },
  addAnotherPlus: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.primary,
    lineHeight: 28,
  },
  addAnotherText: {
    fontSize: 12,
    color: Palette.primary,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
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
});
