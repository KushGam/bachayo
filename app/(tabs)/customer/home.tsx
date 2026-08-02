import { ClosingSoonCard } from '@/components/customer/ClosingSoonCard';
import { BrowsePartnersLink } from '@/components/customer/BrowsePartnersLink';
import { CustomerSectionHeader } from '@/components/customer/CustomerSectionHeader';
import { HomeActiveOrderCard } from '@/components/customer/HomeActiveOrderCard';
import { HomeFilters, HOME_DISTANCE_OPTIONS } from '@/components/customer/HomeFilters';
import { HomeHeroBand } from '@/components/customer/HomeHeroBand';
import { HomeLocationChip } from '@/components/customer/HomeLocationChip';
import { HomeSearchStrip } from '@/components/customer/HomeSearchStrip';
import { HomeMarketDigest } from '@/components/customer/HomeMarketDigest';
import { HomeNearbyEmpty } from '@/components/customer/HomeNearbyEmpty';
import { HomeRecentSearches } from '@/components/customer/HomeRecentSearches';
import { HomeSearchResultRow, HomeSearchResultSkeleton } from '@/components/customer/HomeSearchResultRow';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { RescueBagCard } from '@/components/cards/RescueBagCard';
import { RetryState } from '@/components/ui/RetryState';
import { BagCardSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';
import { HOME_CATEGORY_FILTERS } from '@/constants/partnerCategories';
import { fetchCustomerImpactStats, type CustomerImpactStats } from '@/lib/customerStats';
import { enrichBagsWithLiveStock, isBagBookable } from '@/lib/bagStock';
import {
  attachNearbyBagDistances,
  bagPassesNearbyDistanceFilter,
  fetchNearbyRescueBags,
  filterVisibleNearbyBags,
  resolveNearbyOrigin,
} from '@/lib/nearbyBags';
import { sortBagsByFeaturedTier } from '@/lib/featuredPlacement';
import {
  formatRsPaisa,
  getTodayIsoDateLocal,
  parsePickupDateTimeLocal,
} from '@/lib/helpers';
import { fetchCustomerOrders } from '@/lib/orders';
import { fetchActiveReservedBagIds } from '@/lib/reservations';
import { addRecentSearch, getRecentSearches, removeRecentSearch } from '@/lib/recentSearches';
import { getRescueBagImageUrl, prefetchImages } from '@/lib/images';
import { isPartnerVisibleToCustomers, type PartnerSubscriptionFields } from '@/lib/subscriptions';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useBagsStore, type HomeBag } from '@/store/useBagsStore';
import { useLocationStore } from '@/store/useLocationStore';
import type { CustomerOrderWithDetails } from '@/types/app';
import type { OrderStatus } from '@/types/database';

type HeaderUser = {
  name: string;
};

const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed'];

function getTimeLeftLabel(availableDate: string, pickupEnd: string) {
  const end = parsePickupDateTimeLocal(availableDate, pickupEnd);
  const diffMs = end.getTime() - Date.now();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (mins <= 0) return 'Closing now';
  if (hrs <= 0) return `${remMins}m left`;
  return `${hrs}h ${remMins}m left`;
}

function isClosingSoon(availableDate: string, pickupEnd: string) {
  const end = parsePickupDateTimeLocal(availableDate, pickupEnd).getTime();
  const now = Date.now();
  const diffMs = end - now;
  return diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000;
}

function averageSavingsPercent(bags: HomeBag[]) {
  if (bags.length === 0) return 0;
  const total = bags.reduce((sum, bag) => {
    if (bag.original_price <= 0) return sum;
    return sum + ((bag.original_price - bag.rescue_price) / bag.original_price) * 100;
  }, 0);
  return Math.round(total / bags.length);
}


function bagMatchesSearch(bag: HomeBag, query: string) {
  const lowerQ = query.toLowerCase();
  const title = (bag.title ?? '').toLowerCase();
  const titleNp = (bag.title_np ?? '').toLowerCase();
  const partnerName = (bag.partner?.name ?? '').toLowerCase();
  return title.includes(lowerQ) || titleNp.includes(lowerQ) || partnerName.includes(lowerQ);
}

export default function HomeScreen() {
  const router = useRouter();
  const locale = useAuthStore((s) => s.locale);
  const { bags, setBags, selectedCategory, setSelectedCategory } = useBagsStore();
  const {
    maxDistanceKm,
    setMaxDistanceKm,
    latitude,
    longitude,
    isDefault,
    permissionDenied,
    browseAllBags,
    setBrowseAllBags,
    neighbourhood,
    requestLocation,
  } = useLocationStore();

  const [user, setUser] = useState<HeaderUser>({ name: 'Guest' });
  const [activeOrder, setActiveOrder] = useState<CustomerOrderWithDetails | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(() => {
    const state = useLocationStore.getState();
    if (state.latitude != null && state.longitude != null) {
      return { latitude: state.latitude, longitude: state.longitude };
    }
    return null;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [, forceTick] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<HomeBag[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [reservedBagIds, setReservedBagIds] = useState<Set<string>>(new Set());
  const [impactStats, setImpactStats] = useState<CustomerImpactStats | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [locationRefreshing, setLocationRefreshing] = useState(false);

  const today = getTodayIsoDateLocal();
  const fetchBagsRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(
    () => Promise.resolve(),
  );

  const origin = useMemo(() => resolveNearbyOrigin(coords), [coords]);

  useEffect(() => {
    const timer = setInterval(() => forceTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;
    if (!sessionUser) {
      setIsSignedIn(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', sessionUser.id)
      .maybeSingle();

    setUser({
      name: profile?.full_name || profile?.phone || sessionUser.email?.split('@')[0] || 'Guest',
    });
    setIsSignedIn(true);
  }, []);

  const loadImpactStats = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) {
      setImpactStats(null);
      setIsSignedIn(false);
      return;
    }

    setIsSignedIn(true);
    try {
      setImpactStats(await fetchCustomerImpactStats(userId));
    } catch (error) {
      console.error('[home] impact stats load failed:', error);
      setImpactStats(null);
    }
  }, []);

  const loadReservedBagIds = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) {
      setReservedBagIds(new Set());
      return;
    }
    const ids = await fetchActiveReservedBagIds(userId);
    setReservedBagIds(ids);
  }, []);

  const loadActiveOrder = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) {
      setActiveOrder(null);
      return;
    }

    try {
      const orders = await fetchCustomerOrders(userId);
      const todayOrder = orders.find(
        (order) =>
          ACTIVE_ORDER_STATUSES.includes(order.status) &&
          order.bag?.available_date === today,
      );
      setActiveOrder(todayOrder ?? null);
    } catch (error) {
      console.error('[home] active order load failed:', error);
      setActiveOrder(null);
    }
  }, [today]);

  useEffect(() => {
    void loadProfile();
    void loadActiveOrder();
    void loadReservedBagIds();
    void loadImpactStats();
  }, [loadActiveOrder, loadImpactStats, loadProfile, loadReservedBagIds]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId || cancelled) return;

      const channelName = `customer-home-${userId}`;

      try {
        await subscribePostgresChannel(
          supabase,
          channelName,
          [
            {
              event: 'UPDATE',
              table: 'orders',
              filter: `customer_id=eq.${userId}`,
              callback: (payload) => {
                const updated = (payload as { new?: { status?: string } }).new;
                if (!updated?.status) return;

                if (updated.status === 'picked_up') {
                  setActiveOrder(null);
                  void loadImpactStats();
                } else if (ACTIVE_ORDER_STATUSES.includes(updated.status as OrderStatus)) {
                  void loadActiveOrder();
                }
                void loadReservedBagIds();
                void loadImpactStats();
                void fetchBagsRef.current({ silent: true });
              },
            },
            {
              event: 'INSERT',
              table: 'orders',
              filter: `customer_id=eq.${userId}`,
              callback: (payload) => {
                const inserted = (payload as {
                  new?: { bag_id?: string; quantity?: number };
                }).new;
                if (inserted?.bag_id) {
                  useBagsStore
                    .getState()
                    .incrementBagReserved(inserted.bag_id, inserted.quantity ?? 1);
                }
                void loadActiveOrder();
                void loadReservedBagIds();
                void loadImpactStats();
                void fetchBagsRef.current({ silent: true });
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
                    status?: HomeBag['status'];
                  };
                }).new;
                if (!updated?.id) return;
                useBagsStore.getState().applyBagStock(updated.id, {
                  quantity_reserved: updated.quantity_reserved,
                  quantity_available: updated.quantity_available,
                  status: updated.status,
                });
                void fetchBagsRef.current({ silent: true });
              },
            },
          ],
          () => cancelled,
        );
      } catch (error) {
        if (!cancelled) {
          console.warn('[home] realtime subscribe failed:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      void (async () => {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (userId) {
          await removeChannelByName(supabase, `customer-home-${userId}`);
        }
      })();
    };
  }, [loadActiveOrder, loadImpactStats, loadReservedBagIds]);

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCoords({ latitude, longitude });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    void (async () => {
      const ok = await requestLocation();
      if (!ok) return;
      const { latitude: lat, longitude: lng } = useLocationStore.getState();
      if (lat != null && lng != null) {
        setCoords({ latitude: lat, longitude: lng });
      }
    })();
  }, [requestLocation]);

  const fetchBags = useCallback(async (options?: { silent?: boolean }) => {
    setErrorText(null);
    if (!options?.silent) {
      setLoading(true);
    }

    const { data, error } = await fetchNearbyRescueBags(today);

    if (error) {
      setLoading(false);
      setErrorText(error.message);
      return;
    }

    const visible = filterVisibleNearbyBags(data ?? []);
    const withStock = await enrichBagsWithLiveStock(visible, useBagsStore.getState().bags);
    const bookable = withStock.filter(isBagBookable);
    const withDistance = attachNearbyBagDistances(bookable, origin);

    setBags(withDistance);
    prefetchImages(withDistance.slice(0, 12).map((bag) => getRescueBagImageUrl(bag, 'card')));
    await loadReservedBagIds();
    setLoading(false);
  }, [loadReservedBagIds, origin, setBags, today]);

  fetchBagsRef.current = fetchBags;

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
      void loadActiveOrder();
      void loadReservedBagIds();
      void loadImpactStats();
      void fetchBags({ silent: true });
    }, [fetchBags, loadActiveOrder, loadImpactStats, loadProfile, loadReservedBagIds]),
  );

  useEffect(() => {
    void fetchBags();
  }, [fetchBags]);

  useEffect(() => {
    void getRecentSearches().then(setRecentSearches);
  }, []);

  useEffect(() => {
    if (!isSearching || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const q = searchQuery.trim();
    const timer = setTimeout(() => {
      void (async () => {
        const { data, error } = await supabase
          .from('rescue_bags')
          .select('*, partner:partners!inner(*)')
          .eq('status', 'active')
          .eq('available_date', today)
          .eq('partner.is_active', true)
          .eq('partner.approval_status', 'approved');

        if (error) {
          console.error('[home] search failed:', error);
          setSearchResults([]);
          setSearchLoading(false);
          return;
        }

        const filtered = (data ?? []).filter((row) => {
          const bag = row as HomeBag;
          if (!bagMatchesSearch(bag, q)) return false;
          if (!isPartnerVisibleToCustomers(bag.partner as PartnerSubscriptionFields)) return false;
          return true;
        }) as HomeBag[];

        setSearchResults(filtered);
        setSearchLoading(false);
      })();
    }, 300);

    return () => clearTimeout(timer);
  }, [isSearching, searchQuery, today]);

  const handleSearchFocus = useCallback(() => {
    setIsSearching(true);
  }, []);

  const handleSearchCancel = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
    setSearchLoading(false);
    Keyboard.dismiss();
  }, []);

  const handleRecentSelect = useCallback((term: string) => {
    setSearchQuery(term);
  }, []);

  const handleRecentRemove = useCallback(async (term: string) => {
    const next = await removeRecentSearch(term);
    setRecentSearches(next);
  }, []);

  const handleSearchResultPress = useCallback(
    async (bag: HomeBag) => {
      const term = searchQuery.trim();
      if (term) {
        const next = await addRecentSearch(term);
        setRecentSearches(next);
      }
      router.push(`/bag/${bag.id}`);
    },
    [router, searchQuery],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBags(), loadActiveOrder(), loadReservedBagIds(), loadImpactStats()]);
    setRefreshing(false);
  };

  const filteredBags = useMemo(() => {
    const byCategory =
      selectedCategory === 'all'
        ? bags
        : bags.filter((b) => b.partner.category === selectedCategory);

    const effectiveDistance =
      browseAllBags || !coords ? null : maxDistanceKm;

    const nearby = byCategory.filter((bag) => {
      // Hide only when nothing left to book. Own reservation still appears via Today's pickup;
      // if slots remain after a partial cancel, show the bag again in nearby.
      const left = Math.max(0, bag.quantity_available - bag.quantity_reserved);
      if (bag.status === 'sold_out' || left <= 0) return false;
      return bagPassesNearbyDistanceFilter(bag, effectiveDistance);
    });

    return sortBagsByFeaturedTier(nearby);
  }, [bags, browseAllBags, coords, maxDistanceKm, selectedCategory]);

  const closingSoon = useMemo(
    () => filteredBags.filter((b) => isClosingSoon(b.available_date, b.pickup_end)),
    [filteredBags],
  );

  const partnerCount = useMemo(
    () => new Set(bags.map((bag) => bag.partner_id)).size,
    [bags],
  );

  const avgSavings = useMemo(() => averageSavingsPercent(bags), [bags]);

  const digestStats = useMemo(() => {
    if (isSignedIn && impactStats) {
      const savedLabel =
        impactStats.moneySavedPaisa > 0
          ? formatRsPaisa(impactStats.moneySavedPaisa).replace('Rs ', '₨')
          : '₨ 0';

      return [
        {
          value: String(impactStats.bagsRescued),
          label: locale === 'np' ? 'बचाएको ब्याग' : 'Bags rescued',
        },
        {
          value: savedLabel,
          label: locale === 'np' ? 'बचत' : 'Money saved',
          accent: true,
        },
        {
          value: String(impactStats.reviewsGiven),
          label: locale === 'np' ? 'समीक्षा' : 'Reviews',
        },
        {
          value: String(impactStats.activeReservations),
          label: locale === 'np' ? 'सक्रिय' : 'Active pickups',
        },
      ];
    }

    return [
      {
        value: String(bags.length),
        label: locale === 'np' ? 'ब्याग आज' : 'Bags today',
      },
      {
        value: String(partnerCount),
        label: locale === 'np' ? 'पार्टनर' : 'Partners',
      },
      {
        value: avgSavings > 0 ? `${avgSavings}%` : '—',
        label: locale === 'np' ? 'औसत बचत' : 'Avg savings',
        accent: true,
      },
      {
        value: String(closingSoon.length),
        label: locale === 'np' ? 'छिटो बन्द' : 'Closing soon',
      },
    ];
  }, [
    avgSavings,
    bags.length,
    closingSoon.length,
    impactStats,
    isSignedIn,
    locale,
    partnerCount,
  ]);

  const digestTitle = isSignedIn && impactStats
    ? locale === 'np'
      ? 'तपाईंको प्रभाव'
      : 'Your impact'
    : locale === 'np'
      ? 'आज नजिकै'
      : 'Near you today';

  const categoryOptions = useMemo(
    () =>
      HOME_CATEGORY_FILTERS.map((pill) => ({
        key: pill.key,
        label: locale === 'np' ? pill.labelNp : pill.label,
      })),
    [locale],
  );

  const renderItem = useCallback(
    ({ item }: { item: HomeBag }) => (
      <View style={styles.listItem}>
        <RescueBagCard
          bag={item}
          isReserved={reservedBagIds.has(item.id)}
          onPress={() => router.push(`/bag/${item.id}`)}
          onPartnerPress={() => router.push(`/partner/${item.partner_id}`)}
        />
      </View>
    ),
    [reservedBagIds, router],
  );

  const handleLocationPress = useCallback(() => {
    void (async () => {
      setLocationRefreshing(true);
      try {
        const ok = await requestLocation();
        if (!ok) {
          void Linking.openSettings();
          return;
        }
        const { latitude: lat, longitude: lng } = useLocationStore.getState();
        if (lat != null && lng != null) {
          setCoords({ latitude: lat, longitude: lng });
        }
      } finally {
        setLocationRefreshing(false);
      }
    })();
  }, [requestLocation]);

  const heroBand = <HomeHeroBand userName={user.name} locale={locale} />;

  const searchStrip = (
    <HomeSearchStrip
      placeholder={
        locale === 'np' ? 'रेस्टुरेन्ट, बेकरी, क्याफे खोज्नुहोस्…' : 'Search restaurants, bakeries, cafes…'
      }
      mapLabel={locale === 'np' ? 'नक्सा' : 'Map'}
      value={searchQuery}
      isSearching={isSearching}
      cancelLabel={locale === 'np' ? 'रद्द' : 'Cancel'}
      onChangeText={setSearchQuery}
      onFocus={handleSearchFocus}
      onCancel={handleSearchCancel}
      onMapPress={() => router.push('/(tabs)/customer/explore')}
    />
  );

  const searchPanel = isSearching ? (
    <View style={styles.searchPanel}>
      {searchQuery.trim().length < 2 ? (
        <HomeRecentSearches
          items={recentSearches}
          title={locale === 'np' ? 'हालका खोजहरू' : 'Recent searches'}
          onSelect={handleRecentSelect}
          onRemove={(term) => void handleRecentRemove(term)}
        />
      ) : searchLoading ? (
        <>
          <HomeSearchResultSkeleton />
          <HomeSearchResultSkeleton />
          <HomeSearchResultSkeleton />
        </>
      ) : searchResults.length === 0 ? (
        <View style={styles.searchEmpty}>
          <Text style={styles.searchEmptyTitle}>
            {locale === 'np'
              ? `"${searchQuery.trim()}" को लागि कुनै ब्याग भेटिएन`
              : `No bags found for '${searchQuery.trim()}'`}
          </Text>
          <Text style={styles.searchEmptySubtitle}>
            {locale === 'np'
              ? 'रेस्टुरेन्टको नाम वा ब्यागको प्रकारले खोज्नुहोस्'
              : 'Try searching by restaurant name or bag type'}
          </Text>
        </View>
      ) : (
        searchResults.map((bag) => (
          <HomeSearchResultRow
            key={bag.id}
            bag={bag}
            onPress={() => void handleSearchResultPress(bag)}
          />
        ))
      )}
    </View>
  ) : null;

  const listHeader = (
    <View style={styles.headerWrap}>
      {heroBand}

      {!isSearching ? (
        <HomeLocationChip
          neighbourhood={neighbourhood}
          hasLocation={!isDefault && Boolean(neighbourhood || latitude)}
          refreshing={locationRefreshing}
          locale={locale}
          onPress={handleLocationPress}
        />
      ) : null}

      {permissionDenied && !browseAllBags ? (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionEmoji}>📍</Text>
          <Text style={styles.permissionTitle}>Enable location for best experience</Text>
          <Text style={styles.permissionBody}>
            We use your location to show rescue bags near you. Your location is never stored or
            shared.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.permissionBtn, pressed && { opacity: 0.9 }]}
            onPress={() => void Linking.openSettings()}>
            <Text style={styles.permissionBtnText}>Enable in Settings →</Text>
          </Pressable>
          <Pressable
            style={{ marginTop: 10 }}
            onPress={() => {
              setBrowseAllBags(true);
              setMaxDistanceKm(null);
            }}>
            <Text style={styles.permissionBrowseAnyway}>Browse all bags anyway</Text>
          </Pressable>
        </View>
      ) : null}

      {searchStrip}

      {!isSearching ? (
        <HomeMarketDigest
          stats={digestStats}
          title={digestTitle}
          variant={isSignedIn && impactStats ? 'impact' : 'market'}
        />
      ) : null}

      {!isSearching ? (
        <BrowsePartnersLink locale={locale} onPress={() => router.push('/partners')} />
      ) : null}

      {!isSearching ? (
      <View style={styles.contentSheet}>
        {activeOrder ? (
          <View style={styles.sectionInset}>
            <HomeActiveOrderCard
              order={activeOrder}
              locale={locale}
              onPress={() => router.push(`/order/${activeOrder.id}`)}
            />
          </View>
        ) : null}

        {closingSoon.length > 0 ? (
          <>
            <CustomerSectionHeader
              title={locale === 'np' ? 'छिटो बन्द हुने' : 'Closing soon'}
              subtitle={
                locale === 'np'
                  ? 'छिटो पिकअप गर्नुहोस्'
                  : 'Pick up before the window ends'
              }
              actionLabel={locale === 'np' ? 'नक्सा' : 'Map'}
              onAction={() => router.push('/(tabs)/customer/explore')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}>
              {closingSoon.map((b) => (
                <ClosingSoonCard
                  key={b.id}
                  bag={b}
                  countdownLabel={getTimeLeftLabel(b.available_date, b.pickup_end)}
                  onPress={() => router.push(`/bag/${b.id}`)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        <HomeFilters
          locale={locale}
          categories={categoryOptions}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          distances={HOME_DISTANCE_OPTIONS}
          maxDistanceKm={maxDistanceKm}
          onDistanceChange={setMaxDistanceKm}
        />

        <CustomerSectionHeader
          title={locale === 'np' ? 'नजिकका रेस्क्यू ब्यागहरू' : 'Nearby rescue bags'}
          subtitle={
            locale === 'np'
              ? maxDistanceKm == null
                ? 'सबै सहरहरू'
                : `${maxDistanceKm} किमी भित्र उपलब्ध`
              : maxDistanceKm == null
                ? 'All launch cities'
                : `Available within ${maxDistanceKm} km`
          }
          count={filteredBags.length}
          actionLabel={filteredBags.length > 0 ? (locale === 'np' ? 'नक्सा' : 'Map') : undefined}
          onAction={filteredBags.length > 0 ? () => router.push('/(tabs)/customer/explore') : undefined}
        />

        {errorText ? (
          <View style={styles.sectionInset}>
            <RetryState message={errorText} onRetry={fetchBags} />
          </View>
        ) : null}
      </View>
      ) : null}
      {searchPanel}
    </View>
  );

  if (isSearching) {
    return (
      <View style={styles.screen}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {listHeader}
        </ScrollView>
      </View>
    );
  }

  if (loading && bags.length === 0) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {listHeader}
          <View style={styles.listItem}>
            <BagCardSkeleton />
          </View>
          <View style={styles.listItem}>
            <BagCardSkeleton />
          </View>
          <View style={styles.listItem}>
            <BagCardSkeleton />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlashList
        data={filteredBags}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
        }
        ListEmptyComponent={
          !loading && !errorText ? <HomeNearbyEmpty locale={locale} /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  listContent: {
    paddingBottom: 120,
  },
  headerWrap: {
    marginBottom: 4,
  },
  permissionCard: {
    backgroundColor: '#F5F3EF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  permissionEmoji: {
    fontSize: 36,
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 12,
  },
  permissionBody: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: '#D85A30',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  permissionBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  permissionBrowseAnyway: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  contentSheet: {
    paddingTop: Spacing.sm,
  },
  sectionInset: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  listItem: {
    marginHorizontal: Spacing.lg,
  },
  listSeparator: {
    height: Spacing.md,
  },
  hScroll: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xl,
    gap: Spacing.md,
  },
  searchPanel: {
    marginTop: Spacing.sm,
    paddingBottom: 100,
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
  searchEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  searchEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  searchEmptySubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
