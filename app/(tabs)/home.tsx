import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { RescueBagCard } from '@/components/cards/RescueBagCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { RetryState } from '@/components/ui/RetryState';
import { BagCardSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import {
  formatNprPaisa,
  getTodayIsoDateLocal,
  haversineDistanceKm,
  parsePickupDateTimeLocal,
} from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import { useBagsStore, type HomeBag, type HomeCategoryFilter } from '@/store/useBagsStore';
import type { PartnerCategory } from '@/types/database';

type HeaderUser = {
  name: string;
};

const CATEGORY_PILLS: { key: HomeCategoryFilter; label: string; categories?: PartnerCategory[] }[] = [
  { key: 'all', label: 'All' },
  { key: 'restaurant', label: 'Restaurant', categories: ['restaurant'] },
  { key: 'bakery', label: 'Bakery', categories: ['bakery'] },
  { key: 'dhaba', label: 'Dhaba', categories: ['dhaba'] },
  { key: 'hotel', label: 'Hotel', categories: ['hotel'] },
  { key: 'cafe', label: 'Cafe', categories: ['cafe'] },
];

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

export default function HomeScreen() {
  const router = useRouter();
  const { bags, setBags, selectedCategory, setSelectedCategory } = useBagsStore();

  const [user] = useState<HeaderUser>({ name: 'कुशल' });
  const [area, setArea] = useState<string>('Finding you…');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => forceTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setArea('Enable location');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(nextCoords);

      const reverse = await Location.reverseGeocodeAsync(nextCoords);
      const first = reverse?.[0];
      const place =
        first?.district ||
        first?.subregion ||
        first?.city ||
        first?.region ||
        first?.country ||
        'Nearby';
      setArea(`${place}${first?.region ? `, ${first.region}` : ''}`);
    })();
  }, []);

  const fetchBags = useCallback(async () => {
    setErrorText(null);
    setLoading(true);

    const today = getTodayIsoDateLocal();
    const { data, error } = await supabase
      .from('rescue_bags')
      .select('*, partner:partners(*)')
      .eq('status', 'active')
      .eq('available_date', today);

    if (error) {
      setLoading(false);
      setErrorText(error.message);
      return;
    }

    const withDistance: HomeBag[] = (data ?? []).map((b) => {
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
    setLoading(false);
  }, [coords, setBags]);

  useEffect(() => {
    fetchBags();
  }, [fetchBags]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBags();
    setRefreshing(false);
  };

  const filteredBags = useMemo(() => {
    const pill = CATEGORY_PILLS.find((p) => p.key === selectedCategory);
    if (!pill || pill.key === 'all') return bags;
    const allowed = new Set(pill.categories);
    return bags.filter((b) => allowed.has(b.partner.category));
  }, [bags, selectedCategory]);

  const closingSoon = useMemo(
    () => filteredBags.filter((b) => isClosingSoon(b.available_date, b.pickup_end)),
    [filteredBags],
  );

  const renderItem = useCallback(
    ({ item }: { item: HomeBag }) => (
      <RescueBagCard bag={item} onPress={() => router.push(`/bag/${item.id}`)} />
    ),
    [router],
  );

  const listHeader = (
    <View style={styles.headerWrap}>
      <View style={styles.headerTop}>
        <View style={styles.greetWrap}>
          <Text style={styles.greeting}>नमस्ते, {user.name} 👋</Text>
          <View style={styles.locationRow}>
            <View style={styles.locationPill}>
              <SymbolView
                name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                size={16}
                tintColor={Palette.primary}
              />
              <Text style={styles.locationText}>{area}</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}>
          <SymbolView
            name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
            size={22}
            tintColor={Palette.textPrimary}
          />
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/explore')}
        style={({ pressed }) => [styles.searchBar, pressed && { opacity: 0.85 }]}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          size={18}
          tintColor={Palette.textMuted}
        />
        <Text style={styles.searchPlaceholder}>Search restaurants, bakeries...</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pickup closing soon</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {closingSoon.length === 0 ? (
          <View style={styles.soonEmpty}>
            <Text style={styles.soonEmptyText}>
              {loading ? 'Loading…' : 'No bags closing soon'}
            </Text>
          </View>
        ) : (
          closingSoon.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => router.push(`/bag/${b.id}`)}
              style={({ pressed }) => [styles.soonCard, pressed && { opacity: 0.9 }]}>
              <Image
                source={{
                  uri:
                    b.partner.cover_image_url ||
                    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=60',
                }}
                style={styles.soonImage}
              />
              <View style={styles.soonBody}>
                <Text numberOfLines={1} style={styles.soonPartner}>
                  {b.partner.name}
                </Text>
                <Text style={styles.soonPrice}>{formatNprPaisa(b.rescue_price)}</Text>
                <Text style={styles.soonCountdown}>
                  {getTimeLeftLabel(b.available_date, b.pickup_end)}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
        {CATEGORY_PILLS.map((pill) => {
          const active = pill.key === selectedCategory;
          return (
            <Pressable
              key={pill.key}
              onPress={() => setSelectedCategory(pill.key)}
              style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{pill.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby rescue bags</Text>
      </View>

      {errorText ? <RetryState message={errorText} onRetry={fetchBags} /> : null}
    </View>
  );

  if (loading && bags.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        {listHeader}
        <BagCardSkeleton />
        <BagCardSkeleton />
        <BagCardSkeleton />
      </ScrollView>
    );
  }

  return (
    <FlashList
      data={filteredBags}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={listHeader}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />}
      ListEmptyComponent={
        !loading && !errorText ? (
          <EmptyState
            title="No rescue bags near you right now — check back at 7pm!"
            actionLabel="Open map"
            onAction={() => router.push('/(tabs)/explore')}
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerWrap: {
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  greetWrap: {
    flex: 1,
    gap: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.lightGreenBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primary,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.white,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  hScroll: {
    paddingRight: 10,
    gap: 12,
  },
  soonEmpty: {
    width: 260,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    justifyContent: 'center',
  },
  soonEmptyText: {
    color: Palette.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  soonCard: {
    width: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
  },
  soonImage: {
    width: '100%',
    height: 110,
    backgroundColor: Palette.lightGreenBg,
  },
  soonBody: {
    padding: 14,
    gap: 6,
  },
  soonPartner: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  soonPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primary,
  },
  soonCountdown: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.amber,
  },
  pillsRow: {
    paddingRight: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Palette.white,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
  },
  pillActive: {
    backgroundColor: Palette.lightGreenBg,
    borderColor: Palette.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  pillTextActive: {
    color: Palette.primary,
  },
});
