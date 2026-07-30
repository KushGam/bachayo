import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';

import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { enrichBagsWithLiveStock, isBagBookable } from '@/lib/bagStock';
import { getTodayIsoDateLocal } from '@/lib/helpers';
import {
  attachNearbyBagDistances,
  bagPassesNearbyDistanceFilter,
  fetchNearbyRescueBags,
  filterVisibleNearbyBags,
  resolveNearbyOrigin,
} from '@/lib/nearbyBags';
import { Spacing } from '@/constants/theme';
import { removeChannelByName, subscribePostgresChannel } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useBagsStore, type HomeBag } from '@/store/useBagsStore';
import { useLocationStore } from '@/store/useLocationStore';

import { ExploreBagListCard } from './ExploreBagListCard';
import { ExploreBottomSheet } from './ExploreBottomSheet';
import { ExploreFilterPanel } from './ExploreFilterPanel';
import { ExploreHeader } from './ExploreHeader';
import { ExploreSelectedBagCard } from './ExploreSelectedBagCard';
import { ExploreSheetEmpty } from './ExploreSheetEmpty';
import { ExploreSheetTitle } from './ExploreSheetTitle';
import { exploreStyles as styles } from './exploreStyles';

const KATHMANDU_REGION: Region = {
  latitude: 27.7172,
  longitude: 85.324,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const MAP_STYLE = [
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

function markerPriceLabel(paisa: number) {
  return `₨${Math.round(paisa / 100)}`;
}

export default function ExploreMapNative() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useAuthStore((s) => s.locale);
  const { bags, setBags, selectedCategory, setSelectedCategory } = useBagsStore();
  const { latitude, longitude, maxDistanceKm, setMaxDistanceKm, requestLocation } =
    useLocationStore();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>(() => {
    const state = useLocationStore.getState();
    if (state.latitude != null && state.longitude != null) {
      return {
        latitude: state.latitude,
        longitude: state.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    return KATHMANDU_REGION;
  });
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    () => {
      const state = useLocationStore.getState();
      if (state.latitude != null && state.longitude != null) {
        return { latitude: state.latitude, longitude: state.longitude };
      }
      return null;
    },
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const selectedBag = useMemo(
    () => bags.find((bag) => bag.id === selectedBagId) ?? null,
    [bags, selectedBagId],
  );

  const origin = useMemo(() => resolveNearbyOrigin(userCoords), [userCoords]);

  const filteredBags = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return bags.filter((bag) => {
      if (!isBagBookable(bag)) return false;
      const title = locale === 'np' && bag.title_np ? bag.title_np : bag.title;
      const categoryPass =
        selectedCategory === 'all' ? true : bag.partner.category === selectedCategory;
      const distancePass = bagPassesNearbyDistanceFilter(bag, maxDistanceKm);
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

    const { data, error } = await fetchNearbyRescueBags(today);

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    const visible = filterVisibleNearbyBags(data ?? []);
    const withStock = await enrichBagsWithLiveStock(visible, useBagsStore.getState().bags);
    const nextBags = attachNearbyBagDistances(withStock.filter(isBagBookable), origin);

    setBags(nextBags);
    setLoading(false);
  }, [origin, setBags]);

  const fetchBagsRef = useRef(fetchBags);
  fetchBagsRef.current = fetchBags;

  useEffect(() => {
    if (latitude != null && longitude != null) {
      const coords = { latitude, longitude };
      setUserCoords(coords);
      setRegion((prev) => ({
        ...prev,
        ...coords,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }));
    }
  }, [latitude, longitude]);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

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
    setMaxDistanceKm(5);
  };

  const renderListItem = useCallback(
    ({ item }: { item: HomeBag }) => {
      const title = locale === 'np' && item.title_np ? item.title_np : item.title;
      return (
        <ExploreBagListCard
          bag={item}
          title={title}
          priceLabel={markerPriceLabel(item.rescue_price)}
          selected={selectedBagId === item.id}
          onPress={() => onSelectMarker(item)}
          onPartnerPress={() => router.push(`/partner/${item.partner_id}`)}
        />
      );
    },
    [locale, router, selectedBagId],
  );

  const filtersActive = selectedCategory !== 'all' || maxDistanceKm !== 5;
  const searchPlaceholder =
    locale === 'np' ? 'रेस्टुरेन्ट, बेकरी खोज्नुहोस्…' : 'Search restaurants, bakeries…';

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          customMapStyle={MAP_STYLE}
          showsUserLocation
          showsMyLocationButton={false}>
          {filteredBags.map((bag) => (
            <Marker
              key={bag.id}
              coordinate={{
                latitude: bag.partner.latitude,
                longitude: bag.partner.longitude,
              }}
              onPress={() => onSelectMarker(bag)}>
              <View style={styles.markerWrap}>
                <View style={styles.markerPin}>
                  <Text style={styles.markerPrice}>{markerPriceLabel(bag.rescue_price)}</Text>
                </View>
                <View style={styles.markerPointer} />
              </View>
            </Marker>
          ))}
        </MapView>

        <Pressable
          style={styles.recenterButton}
          onPress={() => {
            if (latitude != null && longitude != null) {
              mapRef.current?.animateToRegion(
                {
                  latitude,
                  longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                },
                600,
              );
            }
          }}>
          <Text style={styles.recenterIcon}>📍</Text>
        </Pressable>

        <View style={[styles.floatingChrome, { paddingTop: insets.top + Spacing.sm }]}>
          <ExploreHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onFilterPress={() => setIsFilterOpen((value) => !value)}
            filtersActive={filtersActive}
            placeholder={searchPlaceholder}
          />
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
      </View>

      <ExploreBottomSheet
        expandForSelection={Boolean(selectedBag)}
        titleRow={<ExploreSheetTitle count={filteredBags.length} locale={locale} />}
        selectedCard={
          selectedBag ? <ExploreSelectedBagCard bag={selectedBag} locale={locale} /> : null
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
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ExploreBottomSheet>
    </View>
  );
}
