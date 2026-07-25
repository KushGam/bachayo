import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerEditHeader } from '@/components/partner/PartnerEditHeader';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { Palette } from '@/constants/Colors';
import { getAreaById, getCityById, resolveLocation } from '@/lib/locations';
import { hapticSuccess } from '@/lib/haptics';
import { capturePartnerLocation, hasPartnerGpsCoords } from '@/lib/partnerGps';
import { mergePartnerMeta } from '@/lib/partnerMeta';
import type { PartnerProfileRow } from '@/lib/partnerProfile';
import { supabase } from '@/lib/supabase';

const isExpoGo = Constants.appOwnership === 'expo';

type PartnerLocationRow = PartnerProfileRow & {
  location_verified?: boolean | null;
};

export default function EditLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [partner, setPartner] = useState<PartnerLocationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState('');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [latitude, setLatitude] = useState(27.7172);
  const [longitude, setLongitude] = useState(85.324);
  const [locationVerified, setLocationVerified] = useState(false);
  const [hasCoords, setHasCoords] = useState(false);

  const loadPartner = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.from('partners').select('*').eq('user_id', userId).maybeSingle();
    if (data) {
      const row = data as PartnerLocationRow;
      setPartner(row);
      setAddress(row.address ?? '');
      setAreaId(row.area_id ?? null);
      const lat = row.latitude;
      const lng = row.longitude;
      setHasCoords(hasPartnerGpsCoords(lat, lng));
      setLatitude(lat ?? 27.7172);
      setLongitude(lng ?? 85.324);
      setLocationVerified(Boolean(row.location_verified));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  const onRecaptureGps = async () => {
    setLocating(true);
    const result = await capturePartnerLocation();
    setLocating(false);

    if (!result.ok) {
      Alert.alert(
        'Location',
        result.reason === 'permission'
          ? 'Enable location in Settings to re-capture your restaurant GPS.'
          : result.message ?? 'Could not get your location. Try again.',
      );
      return;
    }

    setLatitude(result.latitude);
    setLongitude(result.longitude);
    setHasCoords(true);
    setLocationVerified(true);
    setAreaId(result.areaId);
    if (result.address) {
      setAddress(result.address);
    }

    await hapticSuccess();
    Alert.alert('Location updated ✓', 'Your restaurant GPS coordinates were captured.');
  };

  const handleSave = async () => {
    if (!partner) return;
    if (!address.trim()) {
      Alert.alert('Address is required');
      return;
    }
    if (!areaId) {
      Alert.alert('Please select your city and area');
      return;
    }

    const resolved = resolveLocation(areaId);
    const cityId = resolved?.cityId ?? partner.city_id ?? 'kathmandu';
    const area = getAreaById(areaId);
    const areaLabel = area?.name ?? '';
    const cityLabel = getCityById(cityId)?.name ?? '';
    const fullAddress = [address.trim(), areaLabel, cityLabel]
      .filter(Boolean)
      .filter((part, index, arr) => arr.indexOf(part) === index)
      .join(', ');

    setSaving(true);
    const description = mergePartnerMeta(partner.description, {
      neighborhood: areaLabel || undefined,
    });

    const { error } = await supabase
      .from('partners')
      .update({
        address: fullAddress,
        city_id: cityId,
        area_id: areaId,
        latitude,
        longitude,
        location_verified: locationVerified,
        description,
      } as never)
      .eq('id', partner.id);

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await hapticSuccess();
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={Palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <PartnerEditHeader title="Your location" onSave={() => void handleSave()} saving={saving} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          onPress={() => void onRecaptureGps()}
          disabled={locating}
          style={({ pressed }) => [styles.gpsUpdateCard, pressed && { opacity: 0.92 }]}>
          <Text style={styles.gpsUpdateEmoji}>📍</Text>
          <View style={styles.gpsUpdateCopy}>
            <Text style={styles.gpsUpdateTitle}>Update to current location</Text>
            <Text style={styles.gpsUpdateSubtitle}>
              Use GPS to re-capture your restaurant&apos;s exact location
            </Text>
          </View>
          {locating ? (
            <ActivityIndicator color={Palette.primary} />
          ) : (
            <Text style={styles.gpsUpdateCta}>Update →</Text>
          )}
        </Pressable>

        <View style={styles.formCard}>
          {hasCoords ? (
            <View style={styles.coordsBlock}>
              <Text style={styles.coordsLabel}>Current coordinates:</Text>
              <Text style={styles.coordsValue}>
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
              <View
                style={[
                  styles.verifyPill,
                  locationVerified ? styles.verifyPillGps : styles.verifyPillManual,
                ]}>
                <Text
                  style={[
                    styles.verifyPillText,
                    locationVerified ? styles.verifyPillTextGps : styles.verifyPillTextManual,
                  ]}>
                  {locationVerified ? '✓ GPS verified' : 'Manual address'}
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.label}>Full address</Text>
          <TextInput
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              setLocationVerified(false);
            }}
            style={[styles.input, styles.multiline]}
            placeholder="Street, landmark, building name..."
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>City & area</Text>
          <LocationPicker
            value={areaId}
            onChange={(cityId, nextAreaId) => {
              setAreaId(nextAreaId);
              setLocationVerified(false);
              const nextArea = getAreaById(nextAreaId);
              if (nextArea) {
                setLatitude(nextArea.latitude);
                setLongitude(nextArea.longitude);
                setHasCoords(true);
              }
              void cityId;
            }}
            placeholder="Choose location"
          />

          {isExpoGo ? (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderTitle}>
                Map pin adjustment available in the full app
              </Text>
              <Text style={styles.mapCoords}>
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
            </View>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderTitle}>Map pin</Text>
              <Text style={styles.mapCoords}>
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
              <Text style={styles.mapHint}>
                Drag pin support can be enabled in a development build with react-native-maps.
              </Text>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F3EF' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 20, paddingHorizontal: 16 },
  gpsUpdateCard: {
    backgroundColor: '#FAECE7',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  gpsUpdateEmoji: {
    fontSize: 20,
  },
  gpsUpdateCopy: {
    flex: 1,
  },
  gpsUpdateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#993C1D',
  },
  gpsUpdateSubtitle: {
    fontSize: 12,
    color: '#993C1D',
    opacity: 0.7,
    marginTop: 1,
    lineHeight: 16,
  },
  gpsUpdateCta: {
    color: '#D85A30',
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  coordsBlock: {
    gap: 6,
    marginBottom: 4,
  },
  coordsLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  coordsValue: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Menlo',
  },
  verifyPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  verifyPillGps: {
    backgroundColor: '#ECFDF5',
  },
  verifyPillManual: {
    backgroundColor: '#F3F4F6',
  },
  verifyPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  verifyPillTextGps: {
    color: '#065F46',
  },
  verifyPillTextManual: {
    color: '#6B7280',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  multiline: {
    minHeight: 88,
    paddingTop: 12,
  },
  mapPlaceholder: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#FAECE7',
    padding: 16,
    gap: 6,
  },
  mapPlaceholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  mapCoords: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Menlo',
  },
  mapHint: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
});
