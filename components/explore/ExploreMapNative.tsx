import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, type Region } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';

import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import {
  HOME_CATEGORY_FILTERS,
  type HomeCategoryFilter,
} from '@/constants/partnerCategories';
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
    featureType: 'poi.attraction',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
];

const CATEGORY_EMOJI: Record<string, string> = {
  nepali: '🍛',
  restaurant: '🍛',
  cafe: '☕',
  bakery: '🥐',
  fastfood: '🍔',
  hotel: '🏨',
  mart: '🛒',
  dessert: '🍰',
  pizza: '🍕',
  chinese: '🍜',
  indian: '🍲',
  default: '🛍',
};

const MAP_CATEGORY_CHIPS: { id: HomeCategoryFilter; label: string; emoji: string }[] =
  HOME_CATEGORY_FILTERS.map((filter) => ({
    id: filter.key,
    label: filter.label,
    emoji: filter.icon ?? '🛍',
  }));

function getCategoryEmoji(category: string | null | undefined) {
  if (!category) return CATEGORY_EMOJI.default;
  return CATEGORY_EMOJI[category.toLowerCase()] ?? CATEGORY_EMOJI.default;
}

function markerPriceLabel(paisa: number) {
  return `₨${Math.round(paisa / 100)}`;
}

function getBagsLeft(bag: HomeBag): number {
  return (bag.quantity_available ?? 0) - (bag.quantity_reserved ?? 0);
}

export default function ExploreMapNative() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useAuthStore((s) => s.locale);
  const { bags, setBags, selectedCategory, setSelectedCategory } = useBagsStore();
  const { latitude, longitude, maxDistanceKm, setMaxDistanceKm, requestLocation } =
    useLocationStore();
  const mapRef = useRef<MapView | null>(null);

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
  const [locationSearch, setLocationSearch] = useState('');
  const [searching, setSearching] = useState(false);
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

  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);

    try {
      const trimmed = query.trim().replace(/,?\s*nepal$/i, '');
      const results = await Location.geocodeAsync(`${trimmed}, Nepal`);
      if (results.length > 0) {
        const { latitude: lat, longitude: lng } = results[0];
        const nextRegion: Region = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
        setRegion(nextRegion);
        mapRef.current?.animateToRegion(nextRegion, 800);
      }
    } catch (err) {
      console.warn('Location search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const goToUserLocation = async (deltas = { latitudeDelta: 0.02, longitudeDelta: 0.02 }) => {
    let lat = latitude;
    let lng = longitude;

    if (lat == null || lng == null) {
      const granted = await requestLocation();
      if (!granted) return;
      const state = useLocationStore.getState();
      lat = state.latitude;
      lng = state.longitude;
      if (lat == null || lng == null) return;
    }

    const nextRegion: Region = {
      latitude: lat,
      longitude: lng,
      ...deltas,
    };
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 600);
  };

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
        <ClusteredMapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={(next) => {
            if (next?.latitude != null && next?.longitude != null) {
              setRegion(next);
            }
          }}
          showsUserLocation
          showsMyLocationButton={false}
          customMapStyle={MAP_STYLE}
          clusterColor="#D85A30"
          clusterTextColor="white"
          clusterFontFamily="System"
          radius={60}
          extent={512}
          nodeSize={64}
          minPoints={3}
          mapRef={(map) => {
            // Library types this as Ref<MapView>, but runtime passes the MapView instance.
            mapRef.current = map as unknown as MapView | null;
          }}
          renderCluster={(cluster) => {
            const { id, geometry, onPress, properties } = cluster;
            const pointCount = properties.point_count as number;
            const size = pointCount < 5 ? 40 : pointCount < 10 ? 48 : 56;

            return (
              <Marker
                key={`cluster-${id}`}
                coordinate={{
                  longitude: geometry.coordinates[0],
                  latitude: geometry.coordinates[1],
                }}
                onPress={onPress}
                tracksViewChanges={false}>
                <View
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: '#D85A30',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: 'white',
                    shadowColor: '#D85A30',
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '900' }}>
                    {pointCount}
                  </Text>
                </View>
              </Marker>
            );
          }}>
          {filteredBags.map((bag) => {
            const selected = selectedBagId === bag.id;
            const bagsLeft = getBagsLeft(bag);
            const rating = bag.partner.rating ?? 0;

            return (
              <Marker
                // Remount on selection so selected styles update with tracksViewChanges={false}
                key={`${bag.id}-${selected ? 'sel' : 'idle'}`}
                coordinate={{
                  latitude: bag.partner.latitude,
                  longitude: bag.partner.longitude,
                }}
                onPress={() => onSelectMarker(bag)}
                tracksViewChanges={false}>
                <View style={styles.markerWrap}>
                  <View style={[styles.markerPin, selected && styles.markerPinSelected]}>
                    <Text style={styles.markerEmoji}>
                      {getCategoryEmoji(bag.partner.category)}
                    </Text>
                    <Text style={styles.markerPrice}>
                      {markerPriceLabel(bag.rescue_price)}
                    </Text>
                  </View>
                  <View
                    style={[styles.markerPointer, selected && styles.markerPointerSelected]}
                  />
                  {bagsLeft > 0 && bagsLeft <= 3 ? (
                    <View style={styles.markerBadge}>
                      <Text style={styles.markerBadgeText}>{bagsLeft} left!</Text>
                    </View>
                  ) : null}
                  {rating >= 4.5 ? (
                    <View style={styles.markerBadge}>
                      <Text style={{ fontSize: 9 }}>⭐</Text>
                      <Text style={styles.markerBadgeText}>{rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>
              </Marker>
            );
          })}
        </ClusteredMapView>

        <Pressable style={styles.nearMeButton} onPress={() => void goToUserLocation()}>
          <Text style={styles.recenterIcon}>📍</Text>
        </Pressable>

        <Pressable
          style={styles.recenterButton}
          onPress={() =>
            void goToUserLocation({ latitudeDelta: 0.05, longitudeDelta: 0.05 })
          }>
          <Text style={styles.recenterIcon}>◎</Text>
        </Pressable>

        <View style={[styles.floatingChrome, { paddingTop: insets.top + Spacing.sm }]}>
          <ExploreHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onFilterPress={() => setIsFilterOpen((value) => !value)}
            filtersActive={filtersActive}
            placeholder={searchPlaceholder}
          />

          <View style={styles.locationSearchRow}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder="Search area (e.g. Thamel)"
              placeholderTextColor="#9CA3AF"
              style={styles.locationSearchInput}
              returnKeyType="search"
              onSubmitEditing={() => void searchLocation(locationSearch)}
            />
            {searching ? <ActivityIndicator size="small" color="#D85A30" /> : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryChips}
            contentContainerStyle={styles.categoryChipsContent}>
            {MAP_CATEGORY_CHIPS.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}>
                  <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                  <Text
                    style={[styles.categoryChipLabel, active && styles.categoryChipLabelActive]}>
                    {locale === 'np'
                      ? (HOME_CATEGORY_FILTERS.find((f) => f.key === cat.id)?.labelNp ?? cat.label)
                      : cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

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
        titleRow={
          <ExploreSheetTitle
            count={filteredBags.length}
            locale={locale}
            onResetFilters={handleResetFilters}
          />
        }
        selectedCard={
          selectedBag ? <ExploreSelectedBagCard bag={selectedBag} locale={locale} /> : null
        }>
        <View style={styles.sheetContent}>
          {errorText ? <RetryState message={errorText} onRetry={fetchBags} /> : null}

          {loading && bags.length === 0 ? (
            <ListSkeleton count={3} />
          ) : !loading && !errorText && filteredBags.length === 0 ? (
            <ExploreSheetEmpty locale={locale} />
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
