import * as Location from 'expo-location';
import {
  Check,
  ChevronDown,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CITIES } from '@/constants/locations';
import { Palette } from '@/constants/Colors';
import { FloatingShadow, Motion, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';
import {
  findNearestLocation,
  formatLocationLabel,
  getCityById,
  resolveLocation,
  searchLocations,
} from '@/lib/locations';
import { useAuthStore } from '@/store/useAuthStore';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;
const CITY_COUNT = CITIES.length;

type LocationPickerProps = {
  value?: string | null;
  onChange: (cityId: string, areaId: string) => void;
  placeholder?: string;
  error?: string;
  variant?: 'pill' | 'field' | 'explore' | 'valueOnly';
  tone?: 'light' | 'dark';
};

export function LocationPicker({
  value,
  onChange,
  placeholder = 'Choose your location',
  error,
  variant = 'field',
  tone = 'light',
}: LocationPickerProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const locale = useAuthStore((s) => s.locale);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [detecting, setDetecting] = useState(false);

  const resolved = useMemo(() => resolveLocation(value), [value]);
  const [activeCityId, setActiveCityId] = useState(resolved?.cityId ?? CITIES[0].id);

  const sheetTranslateY = useSharedValue(SHEET_MAX_HEIGHT);
  const tabIndex = useSharedValue(0);

  const activeCityIndex = CITIES.findIndex((city) => city.id === activeCityId);

  useEffect(() => {
    if (resolved?.cityId) {
      setActiveCityId(resolved.cityId);
    }
  }, [resolved?.cityId]);

  useEffect(() => {
    tabIndex.value = withSpring(Math.max(0, activeCityIndex), {
      damping: 20,
      stiffness: 200,
      duration: Motion.base,
    });
  }, [activeCityIndex, tabIndex]);

  useEffect(() => {
    if (open) {
      sheetTranslateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      sheetTranslateY.value = withSpring(SHEET_MAX_HEIGHT, { damping: 22, stiffness: 240 });
    }
  }, [open, sheetTranslateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const tabWidth = (windowWidth - Spacing.xl * 2) / CITY_COUNT;

  const tabIndicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth - Spacing.sm,
    transform: [{ translateX: tabIndex.value * tabWidth + Spacing.xs }],
  }), [tabWidth]);

  const close = useCallback(() => {
    Keyboard.dismiss();
    setOpen(false);
    setSearch('');
  }, []);

  const selectLocation = useCallback(
    async (cityId: string, areaId: string) => {
      await hapticButtonPress();
      onChange(cityId, areaId);
      close();
    },
    [close, onChange],
  );

  const handleUseCurrentLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nearest = findNearestLocation(
        position.coords.latitude,
        position.coords.longitude,
      );
      setActiveCityId(nearest.cityId);
      await selectLocation(nearest.cityId, nearest.areaId);
    } finally {
      setDetecting(false);
    }
  };

  const searchResults = useMemo(() => searchLocations(search), [search]);
  const isSearching = search.trim().length > 0;
  const activeCity = getCityById(activeCityId) ?? CITIES[0];

  const displayLabel = resolved
    ? formatLocationLabel(resolved.cityId, resolved.areaId, locale)
    : placeholder;

  return (
    <View>
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={[
          variant === 'pill'
            ? styles.triggerPill
            : variant === 'explore'
              ? styles.triggerExplore
              : variant === 'valueOnly'
                ? styles.triggerValueOnly
                : styles.triggerField,
          variant === 'pill' && tone === 'dark' ? styles.triggerPillDark : null,
          error ? styles.triggerError : null,
        ]}>
        {variant !== 'valueOnly' ? (
          <MapPin
            size={variant === 'pill' || variant === 'explore' ? 16 : 20}
            color={
              variant === 'explore'
                ? Palette.primary
                : tone === 'dark'
                  ? Palette.white
                  : resolved
                    ? Palette.primary
                    : Palette.textSecondary
            }
            strokeWidth={2}
          />
        ) : null}
        <Text
          style={[
            variant === 'explore'
              ? styles.triggerTextExplore
              : variant === 'valueOnly'
                ? styles.triggerValueText
                : styles.triggerText,
            tone === 'dark' && variant !== 'explore' && variant !== 'valueOnly' && styles.triggerTextDark,
            !resolved &&
              (tone === 'dark' && variant !== 'explore' && variant !== 'valueOnly'
                ? styles.triggerPlaceholderDark
                : variant === 'valueOnly'
                  ? styles.triggerValuePlaceholder
                  : styles.triggerPlaceholder),
          ]}
          numberOfLines={1}>
          {displayLabel}
        </Text>
        {variant !== 'valueOnly' ? (
          <ChevronDown
            size={variant === 'explore' ? 14 : 18}
            color={
              variant === 'explore' ? '#6B7280' : tone === 'dark' ? 'rgba(255,255,255,0.8)' : Palette.textSecondary
            }
            strokeWidth={2}
          />
        ) : null}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="none" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: SHEET_MAX_HEIGHT, paddingBottom: insets.bottom + Spacing.lg },
            sheetStyle,
            FloatingShadow,
          ]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Choose your location</Text>

            <View style={styles.searchWrap}>
              <Search size={18} color={Palette.textTertiary} strokeWidth={2} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search city or area..."
                placeholderTextColor={Palette.textTertiary}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <Pressable
              onPress={handleUseCurrentLocation}
              disabled={detecting}
              style={({ pressed }) => [
                styles.currentLocationRow,
                pressed && { opacity: 0.85 },
                detecting && { opacity: 0.6 },
              ]}>
              <Navigation size={20} color={Palette.primary} strokeWidth={2} />
              <Text style={styles.currentLocationText}>
                {detecting ? 'Detecting location…' : 'Use my current location'}
              </Text>
            </Pressable>

            {!isSearching ? (
              <View style={styles.tabsWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabsRow}>
                  {CITIES.map((city) => {
                    const active = city.id === activeCityId;
                    return (
                      <Pressable
                        key={city.id}
                        onPress={() => setActiveCityId(city.id)}
                        style={[styles.cityTab, active && styles.cityTabActive]}>
                        <Text style={[styles.cityTabText, active && styles.cityTabTextActive]}>
                          {locale === 'np' ? city.nameNp : city.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Animated.View style={[styles.tabIndicator, tabIndicatorStyle]} />
              </View>
            ) : null}
          </View>

          <ScrollView
            style={styles.areaList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {isSearching ? (
              searchResults.length === 0 ? (
                <Text style={styles.emptySearch}>
                  No matching areas — try a different search
                </Text>
              ) : (
                searchResults.map((item) => (
                  <AreaRow
                    key={`${item.cityId}-${item.areaId}`}
                    areaName={locale === 'np' ? item.area.nameNp : item.area.name}
                    areaNameSecondary={locale === 'np' ? item.area.name : item.area.nameNp}
                    cityName={locale === 'np' ? item.city.nameNp : item.city.name}
                    selected={value === item.areaId}
                    onPress={() => selectLocation(item.cityId, item.areaId)}
                    showCity
                  />
                ))
              )
            ) : (
              activeCity.areas.map((area) => (
                <AreaRow
                  key={area.id}
                  areaName={locale === 'np' ? area.nameNp : area.name}
                  areaNameSecondary={locale === 'np' ? area.name : area.nameNp}
                  selected={value === area.id}
                  onPress={() => selectLocation(activeCity.id, area.id)}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </Modal>
    </View>
  );
}

function AreaRow({
  areaName,
  areaNameSecondary,
  cityName,
  selected,
  onPress,
  showCity,
}: {
  areaName: string;
  areaNameSecondary: string;
  cityName?: string;
  selected: boolean;
  onPress: () => void;
  showCity?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.areaRow, selected && styles.areaRowSelected]}>
      <View style={styles.areaTextWrap}>
        <View style={styles.areaNameRow}>
          <Text style={[styles.areaName, selected && styles.areaNameSelected]}>{areaName}</Text>
          <Text style={styles.areaNameNp}>{areaNameSecondary}</Text>
        </View>
        {showCity && cityName ? (
          <Text style={styles.areaCity}>{cityName}</Text>
        ) : null}
      </View>
      {selected ? <Check size={20} color={Palette.primary} strokeWidth={2.5} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  triggerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  triggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.lightGreenBg,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxWidth: '100%',
  },
  triggerExplore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.background,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  triggerValueOnly: {
    maxWidth: '46%',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  triggerPillDark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  triggerError: {
    borderColor: Palette.dangerBorder,
  },
  triggerText: {
    flex: 1,
    ...Type.bodyMedium,
    color: Palette.textPrimary,
  },
  triggerTextExplore: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  triggerValueText: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
    textAlign: 'right',
  },
  triggerValuePlaceholder: {
    color: Palette.textTertiary,
  },
  triggerTextDark: {
    color: Palette.white,
    fontWeight: '600',
  },
  triggerPlaceholder: {
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  triggerPlaceholderDark: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
  error: {
    marginTop: Spacing.sm,
    ...Type.caption,
    color: Palette.dangerText,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    paddingBottom: Spacing.md,
  },
  sheetTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    ...Type.body,
    color: Palette.textPrimary,
    paddingVertical: Spacing.sm,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  currentLocationText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '600',
  },
  tabsWrap: {
    gap: Spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  cityTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  cityTabActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  cityTabText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  cityTabTextActive: {
    color: Palette.white,
  },
  tabIndicator: {
    height: 2,
    backgroundColor: Palette.primary,
    borderRadius: 1,
    opacity: 0,
  },
  areaList: {
    flexGrow: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  areaRowSelected: {
    backgroundColor: Palette.lightGreenBg,
    marginHorizontal: -Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderBottomColor: 'transparent',
  },
  areaTextWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  areaNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  areaName: {
    ...Type.bodyMedium,
    color: Palette.textPrimary,
  },
  areaNameSelected: {
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  areaNameNp: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  areaCity: {
    ...Type.label,
    color: Palette.textTertiary,
  },
  emptySearch: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.xxxl,
  },
});
