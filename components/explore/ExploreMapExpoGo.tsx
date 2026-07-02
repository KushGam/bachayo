import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MapRegion } from '@/types/map';

import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { formatDistanceKm, getTodayIsoDateLocal, haversineDistanceKm } from '@/lib/helpers';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { isPartnerVisibleToCustomers } from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useBagsStore, type HomeBag } from '@/store/useBagsStore';
import { useLocationStore } from '@/store/useLocationStore';

import { ExploreBottomSheet } from './ExploreBottomSheet';
import { ExploreFilterPanel, MAX_DISTANCE_OPTIONS } from './ExploreFilterPanel';
import { ExploreHeader } from './ExploreHeader';
import { ExploreMapPlaceholder } from './ExploreMapPlaceholder';
import { ExploreSheetEmpty } from './ExploreSheetEmpty';
import { exploreStyles as styles } from './exploreStyles';

const KATHMANDU_REGION: MapRegion = {
  latitude: 27.7172,
  longitude: 85.324,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

function markerPriceLabel(paisa: number) {
  return `₨${Math.round(paisa / 100)}`;
}

export default function ExploreMapExpoGo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useAuthStore((s) => s.locale);
  const { bags, setBags, selectedCategory, setSelectedCategory } = useBagsStore();
  const { areaId, setLocation } = useLocationStore();

  const [region, setRegion] = useState<MapRegion>(KATHMANDU_REGION);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState<(typeof MAX_DISTANCE_OPTIONS)[number]>(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const selectedBag = useMemo(
    () => bags.find((bag) => bag.id === selectedBagId) ?? null,
    [bags, selectedBagId],
  );

  const filteredBags = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return bags.filter((bag) => {
      const title = locale === 'np' && bag.title_np ? bag.title_np : bag.title;
      const categoryPass =
        selectedCategory === 'all' ? true : bag.partner.category === selectedCategory;
      const distancePass = bag.distance_km == null ? true : bag.distance_km <= maxDistanceKm;
      const searchPass =
        search.length === 0
          ? true
          : bag.partner.name.toLowerCase().includes(search) || title.toLowerCase().includes(search);
      return categoryPass && distancePass && searchPass;
    });
  }, [bags, selectedCategory, maxDistanceKm, searchTerm, locale]);

  const fetchBags = useCallback(async () => {
    const today = getTodayIsoDateLocal();
    setLoading(true);
    setErrorText(null);

    const { data, error } = await supabase
      .from('rescue_bags')
      .select('*, partner:partners!inner(*)')
      .eq('status', 'active')
      .eq('available_date', today)
      .eq('partner.approval_status', 'approved');

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    const visibleBags = (data ?? []).filter((row) => {
      const partner = (row as {
        partner?: {
          city_id?: string | null;
          is_active?: boolean | null;
          subscription_status?: string | null;
        };
      }).partner;
      return isPartnerVisibleToCustomers(partner);
    });

    const nextBags = visibleBags
      .map((row) => {
        const bag = row as unknown as HomeBag;
        const distanceKm =
          userCoords == null
            ? null
            : haversineDistanceKm(userCoords, {
                latitude: bag.partner.latitude,
                longitude: bag.partner.longitude,
              });
        return { ...bag, distance_km: distanceKm };
      })
      .sort((a, b) => {
        if (a.distance_km == null && b.distance_km == null) return 0;
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        return a.distance_km - b.distance_km;
      });

    setBags(nextBags);
    setLoading(false);
  }, [setBags, userCoords]);

  const fetchBagsRef = useRef(fetchBags);
  fetchBagsRef.current = fetchBags;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setUserCoords(coords);
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      });
    })();
  }, []);

  useEffect(() => {
    fetchBags();
  }, [fetchBags]);

  useEffect(() => {
    const channelName = 'realtime-explore-bags';
    let cancelled = false;

    void (async () => {
      try {
        await subscribePostgresChannel(
          supabase,
          channelName,
          [
            {
              table: 'rescue_bags',
              callback: () => {
                void fetchBagsRef.current();
              },
            },
          ],
          () => cancelled,
        );
      } catch (error) {
        if (!cancelled) {
          console.warn('[explore] realtime subscribe failed:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      void removeChannelByName(supabase, channelName);
    };
  }, []);

  const onSelectMarker = (bag: HomeBag) => {
    setSelectedBagId(bag.id);
    setRegion((prev) => ({
      ...prev,
      latitude: bag.partner.latitude,
      longitude: bag.partner.longitude,
    }));
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setMaxDistanceKm(10);
  };

  const renderListItem = useCallback(
    ({ item }: { item: HomeBag }) => {
      const title = locale === 'np' && item.title_np ? item.title_np : item.title;
      return (
        <Pressable style={styles.listCard} onPress={() => onSelectMarker(item)}>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => router.push(`/partner/${item.partner_id}`)} hitSlop={4}>
              <Text numberOfLines={1} style={styles.listPartner}>
                {item.partner.name}
              </Text>
            </Pressable>
            <Text numberOfLines={1} style={styles.listBagTitle}>
              {title}
            </Text>
            <Text style={styles.listMeta}>
              {item.distance_km == null ? 'Distance unknown' : formatDistanceKm(item.distance_km)} •{' '}
              {Math.max(0, item.quantity_available - item.quantity_reserved)} left
            </Text>
          </View>
          <Text style={styles.listPrice}>{markerPriceLabel(item.rescue_price)}</Text>
        </Pressable>
      );
    },
    [locale, router],
  );

  return (
    <View style={styles.container}>
      <ExploreHeader
        areaId={areaId}
        onLocationChange={(cityId, nextAreaId) => setLocation(cityId, nextAreaId)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterPress={() => setIsFilterOpen((value) => !value)}
        paddingTop={insets.top + 8}
      />

      <View style={styles.mapArea}>
        <ExploreMapPlaceholder />

        <ExploreFilterPanel
          visible={isFilterOpen}
          locale={locale}
          selectedCategory={selectedCategory}
          maxDistanceKm={maxDistanceKm}
          onSelectCategory={setSelectedCategory}
          onSelectDistance={setMaxDistanceKm}
          onApply={() => setIsFilterOpen(false)}
        />
      </View>

      <ExploreBottomSheet
        expandForSelection={Boolean(selectedBag)}
        titleRow={
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>Nearby rescue bags</Text>
            {filteredBags.length > 0 ? (
              <View style={styles.bagCountBadge}>
                <Text style={styles.bagCountText}>
                  {filteredBags.length} {filteredBags.length === 1 ? 'bag' : 'bags'}
                </Text>
              </View>
            ) : null}
          </View>
        }
        selectedCard={
          selectedBag ? (
            <View style={styles.selectedCard}>
              <View style={styles.selectedTop}>
              <Pressable onPress={() => router.push(`/partner/${selectedBag.partner_id}`)}>
                <Text style={styles.selectedName}>{selectedBag.partner.name}</Text>
              </Pressable>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{selectedBag.partner.category}</Text>
                </View>
              </View>
              <Text style={styles.selectedMeta}>
                Today: {Math.max(0, selectedBag.quantity_available - selectedBag.quantity_reserved)} bags
                available
              </Text>
              <Pressable
                style={({ pressed }) => [styles.reserveButton, pressed && { opacity: 0.88 }]}
                onPress={() => router.push(`/bag/${selectedBag.id}`)}>
                <Text style={styles.reserveButtonText}>Reserve now</Text>
              </Pressable>
            </View>
          ) : null
        }>
        <View style={styles.sheetContent}>
          {errorText ? <RetryState message={errorText} onRetry={fetchBags} /> : null}

          {loading && bags.length === 0 ? (
            <ListSkeleton count={3} />
          ) : !loading && !errorText && filteredBags.length === 0 ? (
            <ExploreSheetEmpty onResetFilters={handleResetFilters} />
          ) : (
            <FlashList
              data={filteredBags}
              keyExtractor={(item) => item.id}
              renderItem={renderListItem}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ExploreBottomSheet>
    </View>
  );
}
