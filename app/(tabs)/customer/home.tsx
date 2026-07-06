import { ClosingSoonCard } from '@/components/customer/ClosingSoonCard';
import { CustomerSectionHeader } from '@/components/customer/CustomerSectionHeader';
import { HomeActiveOrderCard } from '@/components/customer/HomeActiveOrderCard';
import { HomeHeroBand } from '@/components/customer/HomeHeroBand';
import { HomeMarketDigest } from '@/components/customer/HomeMarketDigest';
import { HomeNearbyEmpty } from '@/components/customer/HomeNearbyEmpty';
import { HomeRecentSearches } from '@/components/customer/HomeRecentSearches';
import { HomeSearchResultRow, HomeSearchResultSkeleton } from '@/components/customer/HomeSearchResultRow';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { RescueBagCard } from '@/components/cards/RescueBagCard';
import { RetryState } from '@/components/ui/RetryState';
import { BagCardSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { HOME_CATEGORY_FILTERS, type HomeCategoryFilter } from '@/constants/partnerCategories';
import { hapticButtonPress } from '@/lib/haptics';
import {
  getTodayIsoDateLocal,
  haversineDistanceKm,
  parsePickupDateTimeLocal,
} from '@/lib/helpers';
import { fetchCustomerOrders } from '@/lib/orders';
import { fetchActiveReservedBagIds } from '@/lib/reservations';
import { addRecentSearch, getRecentSearches, removeRecentSearch } from '@/lib/recentSearches';
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
const DISTANCE_OPTIONS = [2, 5, 10, 25] as const;

const CATEGORY_EMOJI: Record<HomeCategoryFilter, string> = {
  all: '🍽',
  restaurant: '🍛',
  cafe: '☕',
  bakery: '🥐',
  mart: '🛒',
  hotel: '🏨',
};

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

function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, '\\$&');
}

export default function HomeScreen() {
  const router = useRouter();
  const locale = useAuthStore((s) => s.locale);
  const { bags, setBags, selectedCategory, setSelectedCategory } = useBagsStore();
  const { cityId, areaId, maxDistanceKm, setLocation, setMaxDistanceKm } = useLocationStore();

  const [user, setUser] = useState<HeaderUser>({ name: 'Guest' });
  const [activeOrder, setActiveOrder] = useState<CustomerOrderWithDetails | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
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

  const today = getTodayIsoDateLocal();

  useEffect(() => {
    const timer = setInterval(() => forceTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;
    if (!sessionUser) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', sessionUser.id)
      .maybeSingle();

    setUser({
      name: profile?.full_name || profile?.phone || sessionUser.email?.split('@')[0] || 'Guest',
    });
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
          order.bag.available_date === today,
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
  }, [loadActiveOrder, loadProfile, loadReservedBagIds]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
      void loadActiveOrder();
      void loadReservedBagIds();
    }, [loadActiveOrder, loadProfile, loadReservedBagIds]),
  );

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
                } else if (ACTIVE_ORDER_STATUSES.includes(updated.status as OrderStatus)) {
                  void loadActiveOrder();
                }
                void loadReservedBagIds();
              },
            },
            {
              event: 'INSERT',
              table: 'orders',
              filter: `customer_id=eq.${userId}`,
              callback: () => {
                void loadActiveOrder();
                void loadReservedBagIds();
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
  }, [loadActiveOrder, loadReservedBagIds]);

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    })();
  }, []);

  const fetchBags = useCallback(async () => {
    setErrorText(null);
    setLoading(true);

    const { data, error } = await supabase
      .from('rescue_bags')
      .select('*, partner:partners!inner(*)')
      .eq('status', 'active')
      .eq('available_date', today)
      .eq('partner.approval_status', 'approved');

    if (error) {
      setLoading(false);
      setErrorText(error.message);
      return;
    }

    const cityFiltered = (data ?? []).filter((row) => {
      const partner = (row as {
        partner?: {
          city_id?: string | null;
          is_active?: boolean | null;
          subscription_status?: string | null;
        };
      }).partner;
      if (!isPartnerVisibleToCustomers(partner as PartnerSubscriptionFields)) return false;
      if (!partner?.city_id) return cityId === 'kathmandu';
      return partner.city_id === cityId;
    });

    const withDistance: HomeBag[] = cityFiltered.map((b) => {
      const partner = (b as unknown as { partner: { latitude: number; longitude: number } }).partner;
      const distance =
        coords && partner
          ? haversineDistanceKm(coords, { latitude: partner.latitude, longitude: partner.longitude })
          : null;
      return { ...(b as unknown as HomeBag), distance_km: distance };
    });

    withDistance.sort((a, b) => {
      if (a.distance_km == null && b.distance_km == null) return 0;
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });

    setBags(withDistance);
    await loadReservedBagIds();
    setLoading(false);
  }, [cityId, coords, loadReservedBagIds, setBags, today]);

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
        const pattern = `%${escapeIlike(q)}%`;
        const { data, error } = await supabase
          .from('rescue_bags')
          .select('*, partner:partners!inner(*)')
          .eq('status', 'active')
          .eq('available_date', today)
          .eq('partner.is_active', true)
          .eq('partner.approval_status', 'approved')
          .or(`title.ilike.${pattern},partner.name.ilike.${pattern}`);

        if (error) {
          console.error('[home] search failed:', error);
          setSearchResults([]);
          setSearchLoading(false);
          return;
        }

        const filtered = (data ?? []).filter((row) => {
          const partner = (row as {
            partner?: {
              city_id?: string | null;
              is_active?: boolean | null;
              subscription_status?: string | null;
            };
          }).partner;
          if (!isPartnerVisibleToCustomers(partner as PartnerSubscriptionFields)) return false;
          if (!partner?.city_id) return cityId === 'kathmandu';
          return partner.city_id === cityId;
        }) as HomeBag[];

        setSearchResults(filtered);
        setSearchLoading(false);
      })();
    }, 300);

    return () => clearTimeout(timer);
  }, [cityId, isSearching, searchQuery, today]);

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
    await Promise.all([fetchBags(), loadActiveOrder(), loadReservedBagIds()]);
    setRefreshing(false);
  };

  const filteredBags = useMemo(() => {
    const byCategory =
      selectedCategory === 'all'
        ? bags
        : bags.filter((b) => b.partner.category === selectedCategory);

    return byCategory.filter((bag) => {
      if (bag.distance_km == null) return true;
      return bag.distance_km <= maxDistanceKm;
    });
  }, [bags, maxDistanceKm, selectedCategory]);

  const closingSoon = useMemo(
    () => filteredBags.filter((b) => isClosingSoon(b.available_date, b.pickup_end)),
    [filteredBags],
  );

  const partnerCount = useMemo(
    () => new Set(bags.map((bag) => bag.partner_id)).size,
    [bags],
  );

  const avgSavings = useMemo(() => averageSavingsPercent(bags), [bags]);

  const digestStats = useMemo(
    () => [
      {
        value: String(bags.length),
        label: locale === 'np' ? 'ब्याग' : 'Bags',
      },
      {
        value: String(partnerCount),
        label: locale === 'np' ? 'पार्टनर' : 'Partners',
      },
      {
        value: avgSavings > 0 ? `${avgSavings}%` : '—',
        label: locale === 'np' ? 'बचत' : 'Savings',
      },
      {
        value: String(closingSoon.length),
        label: locale === 'np' ? 'छिटो' : 'Coming Soon',
      },
    ],
    [avgSavings, bags.length, closingSoon.length, locale, partnerCount],
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

  const heroBand = (
    <HomeHeroBand
      userName={user.name}
      locale={locale}
      cityId={cityId}
      areaId={areaId}
      onLocationChange={setLocation}
      searchPlaceholder={
        locale === 'np' ? 'रेस्टुरेन्ट, बेकरी, क्याफे खोज्नुहोस्…' : 'Search restaurants, bakeries, cafes…'
      }
      mapLabel={locale === 'np' ? 'नक्सा' : 'Map'}
      searchQuery={searchQuery}
      isSearching={isSearching}
      cancelLabel={locale === 'np' ? 'रद्द' : 'Cancel'}
      onSearchChange={setSearchQuery}
      onSearchFocus={handleSearchFocus}
      onSearchCancel={handleSearchCancel}
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

      {!isSearching ? <HomeMarketDigest stats={digestStats} /> : null}

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

        <CustomerSectionHeader
          title={locale === 'np' ? 'श्रेणी अनुसार' : 'Browse by category'}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}>
          {HOME_CATEGORY_FILTERS.map((pill) => {
            const active = pill.key === selectedCategory;
            const label = locale === 'np' ? pill.labelNp : pill.label;
            return (
              <Pressable
                key={pill.key}
                onPress={() => {
                  void hapticButtonPress();
                  setSelectedCategory(pill.key);
                }}
                style={[styles.categoryPill, active && styles.categoryPillActive]}>
                <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[pill.key]}</Text>
                <Text
                  numberOfLines={1}
                  style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <CustomerSectionHeader
          title={locale === 'np' ? 'दूरी' : 'Distance'}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}>
          {DISTANCE_OPTIONS.map((km) => {
            const active = maxDistanceKm === km;
            return (
              <Pressable
                key={km}
                onPress={() => {
                  void hapticButtonPress();
                  setMaxDistanceKm(km);
                }}
                style={[styles.categoryPill, active && styles.categoryPillActive]}>
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                  {km} km
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <CustomerSectionHeader
          title={locale === 'np' ? 'नजिकका रेस्क्यू ब्यागहरू' : 'Nearby rescue bags'}
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
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
    paddingBottom: 100,
  },
  headerWrap: {
    marginBottom: 4,
  },
  contentSheet: {
    paddingTop: 8,
  },
  sectionInset: {
    marginHorizontal: 16,
  },
  listItem: {
    marginHorizontal: 16,
  },
  hScroll: {
    paddingHorizontal: 16,
    paddingRight: 24,
    gap: 12,
  },
  pillsRow: {
    paddingHorizontal: 16,
    paddingRight: 24,
    gap: 0,
  },
  categoryPill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: {
    backgroundColor: Palette.primary,
    borderWidth: 0,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  categoryLabelActive: {
    color: Palette.white,
  },
  searchPanel: {
    marginTop: 8,
    paddingBottom: 100,
  },
  searchEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    backgroundColor: Palette.white,
  },
  searchEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  searchEmptySubtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
