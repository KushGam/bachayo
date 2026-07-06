import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrowsePartnerCard } from '@/components/customer/browse/BrowsePartnerCard';
import { BrowsePartnersEmpty } from '@/components/customer/browse/BrowsePartnersEmpty';
import { BrowsePartnersHeader } from '@/components/customer/browse/BrowsePartnersHeader';
import {
  BrowsePartnersQuickBar,
  type BrowseSortKey,
} from '@/components/customer/browse/BrowsePartnersQuickBar';
import { BrowsePartnersSkeleton } from '@/components/customer/browse/BrowsePartnersSkeleton';
import { BrowsePartnersToolbar } from '@/components/customer/browse/BrowsePartnersToolbar';
import { HomeFilters } from '@/components/customer/HomeFilters';
import { RetryState } from '@/components/ui/RetryState';
import { Palette } from '@/constants/Colors';
import { HOME_CATEGORY_FILTERS, type HomeCategoryFilter } from '@/constants/partnerCategories';
import { Spacing, Type, Radius } from '@/constants/theme';
import { formatLocationLabel, getAreaById, getCityById } from '@/lib/locations';
import {
  computeBrowsePartnerDistance,
  countPartnersHiddenByDistance,
  fetchBrowsePartners,
  partnerPassesBrowseDistanceFilter,
} from '@/lib/partnerBrowse';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import type { PartnerWithStats } from '@/types/app';
import type { Partner } from '@/types/database';

const DISTANCE_OPTIONS = [2, 5, 10, 25] as const;

type BrowsePartner = PartnerWithStats & {
  area_id?: string | null;
  distance_km: number | null;
};

function partnerMatchesSearch(partner: PartnerWithStats, query: string) {
  const lower = query.toLowerCase();
  return (
    partner.name.toLowerCase().includes(lower) ||
    (partner.name_np ?? '').toLowerCase().includes(lower)
  );
}

function applyBrowseBaseFilters(
  partners: BrowsePartner[],
  {
    searchQuery,
    selectedCategory,
    bagsTodayOnly,
  }: {
    searchQuery: string;
    selectedCategory: HomeCategoryFilter;
    bagsTodayOnly: boolean;
  },
) {
  const trimmedSearch = searchQuery.trim();
  let rows = partners;

  if (trimmedSearch.length > 0) {
    rows = rows.filter((partner) => partnerMatchesSearch(partner, trimmedSearch));
  }

  if (selectedCategory !== 'all') {
    rows = rows.filter((partner) => partner.category === selectedCategory);
  }

  if (bagsTodayOnly) {
    rows = rows.filter((partner) => partner.today_bag_count > 0);
  }

  return rows;
}

export default function BrowsePartnersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useAuthStore((s) => s.locale);
  const { cityId, areaId, maxDistanceKm, setLocation, setMaxDistanceKm } = useLocationStore();

  const [partners, setPartners] = useState<PartnerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HomeCategoryFilter>('all');
  const [sortBy, setSortBy] = useState<BrowseSortKey>('nearest');
  const [bagsTodayOnly, setBagsTodayOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const areaLabel = useMemo(() => {
    const area = getAreaById(areaId);
    if (area) return locale === 'np' ? area.nameNp : area.name;
    return formatLocationLabel(cityId, areaId, locale);
  }, [areaId, cityId, locale]);

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

  const origin = useMemo(() => {
    const area = getAreaById(areaId);
    if (area) return { latitude: area.latitude, longitude: area.longitude };
    const city = getCityById(cityId);
    if (city) return { latitude: city.latitude, longitude: city.longitude };
    if (coords) return coords;
    return null;
  }, [areaId, cityId, coords]);

  const loadPartners = useCallback(async () => {
    setErrorText(null);
    setLoading(true);
    try {
      const rows = await fetchBrowsePartners(cityId);
      setPartners(rows);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Failed to load restaurants');
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  useFocusEffect(
    useCallback(() => {
      void loadPartners();
    }, [loadPartners]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPartners();
    setRefreshing(false);
  };

  const partnersWithDistance = useMemo((): BrowsePartner[] => {
    return partners.map((partner) => {
      const row = partner as Partner & { area_id?: string | null };
      return {
        ...partner,
        area_id: row.area_id ?? null,
        distance_km: origin
          ? computeBrowsePartnerDistance(origin, {
              latitude: partner.latitude,
              longitude: partner.longitude,
              area_id: row.area_id ?? null,
            })
          : null,
      };
    });
  }, [origin, partners]);

  const filteredPartners = useMemo(() => {
    const rows = applyBrowseBaseFilters(partnersWithDistance, {
      searchQuery,
      selectedCategory,
      bagsTodayOnly,
    }).filter((partner) => partnerPassesBrowseDistanceFilter(partner, maxDistanceKm));

    return rows.sort((a, b) => {
      if (sortBy === 'rating') {
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
      }
      if (sortBy === 'bags') {
        const bagDiff = b.today_bag_count - a.today_bag_count;
        if (bagDiff !== 0) return bagDiff;
      }
      if (a.distance_km == null && b.distance_km == null) return a.name.localeCompare(b.name);
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });
  }, [
    bagsTodayOnly,
    maxDistanceKm,
    partnersWithDistance,
    searchQuery,
    selectedCategory,
    sortBy,
  ]);

  const preDistanceFiltered = useMemo(
    () =>
      applyBrowseBaseFilters(partnersWithDistance, {
        searchQuery,
        selectedCategory,
        bagsTodayOnly,
      }),
    [bagsTodayOnly, partnersWithDistance, searchQuery, selectedCategory],
  );

  const hiddenByDistanceCount = useMemo(
    () => countPartnersHiddenByDistance(preDistanceFiltered, maxDistanceKm),
    [maxDistanceKm, preDistanceFiltered],
  );

  const categoryOptions = useMemo(
    () =>
      HOME_CATEGORY_FILTERS.map((pill) => ({
        key: pill.key,
        label: locale === 'np' ? pill.labelNp : pill.label,
      })),
    [locale],
  );

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setBagsTodayOnly(false);
    setSelectedCategory('all');
    Keyboard.dismiss();
  }, []);

  const widenDistance = useCallback(() => {
    const currentIndex = DISTANCE_OPTIONS.findIndex((km) => km === maxDistanceKm);
    const next = DISTANCE_OPTIONS[Math.min(currentIndex + 1, DISTANCE_OPTIONS.length - 1)];
    setMaxDistanceKm(next);
  }, [maxDistanceKm, setMaxDistanceKm]);

  const renderItem = useCallback(
    ({ item }: { item: BrowsePartner }) => (
      <View style={styles.itemInset}>
        <BrowsePartnerCard
          partner={item}
          distanceKm={item.distance_km}
          onPress={() => router.push(`/partner/${item.id}`)}
        />
      </View>
    ),
    [router],
  );

  const headerContent = (
    <>
      <BrowsePartnersToolbar
        locale={locale}
        embedded
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        onMapPress={() => router.push('/(tabs)/customer/explore')}
      />

      <HomeFilters
        embedded
        locale={locale}
        categories={categoryOptions}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        distances={DISTANCE_OPTIONS}
        maxDistanceKm={maxDistanceKm}
        onDistanceChange={setMaxDistanceKm}
      />

      <BrowsePartnersQuickBar
        embedded
        locale={locale}
        sortBy={sortBy}
        onSortChange={setSortBy}
        bagsTodayOnly={bagsTodayOnly}
        onBagsTodayOnlyChange={setBagsTodayOnly}
      />

      <View style={styles.resultsBar}>
        <Text style={styles.resultsTitle}>
          {filteredPartners.length}{' '}
          {locale === 'np'
            ? 'रेस्टुरेन्ट'
            : `restaurant${filteredPartners.length === 1 ? '' : 's'}`}
        </Text>
        <Text style={styles.resultsMeta}>
          {locale === 'np'
            ? `${maxDistanceKm} किमी · ${areaLabel}`
            : `Within ${maxDistanceKm} km · ${areaLabel}`}
        </Text>
      </View>

      {hiddenByDistanceCount > 0 && filteredPartners.length === 0 ? (
        <Pressable onPress={widenDistance} style={styles.hintBanner}>
          <Text style={styles.hintText}>
            {locale === 'np'
              ? `${hiddenByDistanceCount} रेस्टुरेन्ट ${maxDistanceKm} किमी भन्दा टाढा छ — दूरी बढाउनुहोस्`
              : `${hiddenByDistanceCount} restaurant${hiddenByDistanceCount === 1 ? '' : 's'} outside ${maxDistanceKm} km — widen distance`}
          </Text>
        </Pressable>
      ) : null}
    </>
  );

  const listHeader = (
    <Pressable onPress={Keyboard.dismiss}>
      <BrowsePartnersHeader
        paddingTop={insets.top + Spacing.sm}
        locale={locale}
        areaId={areaId}
        onLocationChange={setLocation}
      />
      <View style={styles.contentInset}>{headerContent}</View>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {loading && partners.length === 0 ? (
        <View style={styles.loadingWrap}>
          {listHeader}
          <View style={styles.contentInset}>
            <BrowsePartnersSkeleton embedded count={4} />
          </View>
        </View>
      ) : (
        <FlashList
          data={filteredPartners}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={104}
          ListHeaderComponent={
            <>
              {listHeader}
              {errorText ? (
                <View style={styles.contentInset}>
                  <RetryState message={errorText} onRetry={loadPartners} />
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={
            !errorText && !loading ? (
              <View style={styles.contentInset}>
                <BrowsePartnersEmpty
                  locale={locale}
                  hasSearch={searchQuery.trim().length > 0}
                  bagsTodayOnly={bagsTodayOnly}
                  hiddenByDistance={hiddenByDistanceCount > 0}
                  onClearFilters={clearFilters}
                  onWidenDistance={widenDistance}
                />
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  contentInset: {
    paddingHorizontal: Spacing.lg,
  },
  itemInset: {
    paddingHorizontal: Spacing.lg,
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  resultsTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  resultsMeta: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  hintBanner: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  hintText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.primaryDark,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
  },
});
