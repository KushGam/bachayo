import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import MapView, { Marker, Region } from 'react-native-maps';

import { EmptyState } from '@/components/ui/EmptyState';
import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { formatDistanceKm, getTodayIsoDateLocal, haversineDistanceKm } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useBagsStore, type HomeBag } from '@/store/useBagsStore';

const KATHMANDU_REGION: Region = {
  latitude: 27.7172,
  longitude: 85.324,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const MAX_DISTANCE_OPTIONS = [2, 5, 10, 25] as const;
const SHEET_HEIGHT = Dimensions.get('window').height * 0.5;

const CATEGORIES: {
  key: 'all' | 'restaurant' | 'bakery' | 'dhaba' | 'hotel' | 'cafe';
  label: string;
}[] = [
  { key: 'all', label: 'All' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'bakery', label: 'Bakery' },
  { key: 'dhaba', label: 'Dhaba' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'cafe', label: 'Cafe' },
];

function markerPriceLabel(paisa: number) {
  return `₨${Math.round(paisa / 100)}`;
}

export default function ExploreMapContent() {
  const router = useRouter();
  const locale = useAuthStore((s) => s.locale);
  const { bags, setBags, selectedCategory, setSelectedCategory } = useBagsStore();

  const [region, setRegion] = useState<Region>(KATHMANDU_REGION);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState<(typeof MAX_DISTANCE_OPTIONS)[number]>(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const sheetLift = useSharedValue(0);

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

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetLift.value }],
  }));

  const fetchBags = useCallback(async () => {
    const today = getTodayIsoDateLocal();
    setLoading(true);
    setErrorText(null);

    const { data, error } = await supabase
      .from('rescue_bags')
      .select('*, partner:partners(*)')
      .eq('status', 'active')
      .eq('available_date', today);

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    const nextBags = (data ?? [])
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
    const channel = supabase
      .channel('realtime-explore-bags')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_bags' }, () => {
        fetchBags();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBags]);

  useEffect(() => {
    sheetLift.value = withTiming(selectedBag ? -112 : 0, { duration: 220 });
  }, [selectedBag, sheetLift]);

  const onSelectMarker = (bag: HomeBag) => {
    setSelectedBagId(bag.id);
    setRegion((prev) => ({
      ...prev,
      latitude: bag.partner.latitude,
      longitude: bag.partner.longitude,
    }));
  };

  const renderListItem = useCallback(
    ({ item }: { item: HomeBag }) => {
      const title = locale === 'np' && item.title_np ? item.title_np : item.title;
      return (
        <Pressable style={styles.listCard} onPress={() => onSelectMarker(item)}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.listPartner}>
              {item.partner.name}
            </Text>
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
    [locale],
  );

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} onRegionChangeComplete={setRegion}>
        {filteredBags.map((bag) => (
          <Marker
            key={bag.id}
            coordinate={{
              latitude: bag.partner.latitude,
              longitude: bag.partner.longitude,
            }}
            onPress={() => onSelectMarker(bag)}>
            <View style={styles.markerPin}>
              <Text style={styles.markerPrice}>{markerPriceLabel(bag.rescue_price)}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={18}
              tintColor={Palette.textMuted}
            />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search restaurants, bakeries..."
              placeholderTextColor={Palette.textMuted}
              style={styles.searchInput}
            />
          </View>
          <Pressable onPress={() => setIsFilterOpen((v) => !v)} style={styles.filterButton}>
            <SymbolView
              name={{ ios: 'line.3.horizontal.decrease.circle', android: 'tune', web: 'tune' }}
              size={20}
              tintColor={Palette.primary}
            />
          </Pressable>
        </View>

        {isFilterOpen ? (
          <View style={styles.filterPanel}>
            <Text style={styles.filterTitle}>Category</Text>
            <View style={styles.filterWrap}>
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setSelectedCategory(cat.key)}
                    style={[styles.filterPill, active && styles.filterPillActive]}>
                    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.filterTitle, { marginTop: 10 }]}>Max distance</Text>
            <View style={styles.filterWrap}>
              {MAX_DISTANCE_OPTIONS.map((km) => {
                const active = maxDistanceKm === km;
                return (
                  <Pressable
                    key={km}
                    onPress={() => setMaxDistanceKm(km)}
                    style={[styles.filterPill, active && styles.filterPillActive]}>
                    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                      {km} km
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.sheetHandle} />

        {selectedBag ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedTop}>
              <Text style={styles.selectedName}>{selectedBag.partner.name}</Text>
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
        ) : null}

        <Text style={styles.listTitle}>Nearby rescue bags</Text>

        {errorText ? <RetryState message={errorText} onRetry={fetchBags} /> : null}

        {loading && bags.length === 0 ? (
          <ListSkeleton count={3} />
        ) : (
          <FlashList
            data={filteredBags}
            keyExtractor={(item) => item.id}
            renderItem={renderListItem}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              !loading && !errorText ? (
                <EmptyState
                  title="No bags found for this filter."
                  actionLabel="Explore home"
                  onAction={() => router.push('/(tabs)/home')}
                />
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 22 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  topOverlay: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Palette.lightGreenBg,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: Palette.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.white,
    borderWidth: 1.2,
    borderColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPanel: {
    backgroundColor: Palette.white,
    borderWidth: 1.2,
    borderColor: Palette.lightGreenBg,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    backgroundColor: Palette.white,
    borderWidth: 1.2,
    borderColor: Palette.lightGreenBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterPillActive: {
    backgroundColor: Palette.lightGreenBg,
    borderColor: Palette.primary,
  },
  filterPillText: {
    color: Palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: Palette.primary,
  },
  markerPin: {
    minWidth: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Palette.white,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  markerPrice: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Palette.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Palette.lightGreenBg,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginBottom: 10,
  },
  selectedCard: {
    backgroundColor: Palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 12,
    gap: 8,
    marginBottom: 10,
  },
  selectedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Palette.lightGreenBg,
  },
  categoryBadgeText: {
    color: Palette.primary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  selectedMeta: {
    color: Palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  reserveButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  reserveButtonText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '700',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textPrimary,
    marginBottom: 10,
  },
  listCard: {
    backgroundColor: Palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listPartner: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  listBagTitle: {
    fontSize: 13,
    color: Palette.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  listMeta: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 5,
    fontWeight: '500',
  },
  listPrice: {
    color: Palette.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
