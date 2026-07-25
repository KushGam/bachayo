import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ExternalLink, Link2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { getAreaById, resolveLocation } from '@/lib/locations';
import { hapticSuccess } from '@/lib/haptics';
import {
  buildGoogleMapsUrl,
  looksLikeMapLink,
  resolveMapLink,
} from '@/lib/mapLinks';
import {
  capturePartnerLocation,
  hasPartnerGpsCoords,
  savePartnerLocation,
} from '@/lib/partnerGps';
import { decodePartnerMeta, mergePartnerMeta } from '@/lib/partnerMeta';
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
  const [applyingLink, setApplyingLink] = useState(false);
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState('');
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
      const meta = decodePartnerMeta(row.description);
      setPartner(row);
      setAddress(row.address ?? '');
      setMapLink(meta.map_url ?? '');
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

  const persistLocation = async ({
    nextAddress,
    nextAreaId,
    nextLat,
    nextLng,
    nextVerified,
    nextMapLink,
    showSuccessAlert,
  }: {
    nextAddress: string;
    nextAreaId: string | null;
    nextLat: number;
    nextLng: number;
    nextVerified: boolean;
    nextMapLink: string;
    showSuccessAlert?: string;
  }) => {
    if (!partner) return false;

    const resolved = nextAreaId ? resolveLocation(nextAreaId) : null;
    const cityId = resolved?.cityId ?? partner.city_id ?? 'kathmandu';
    const area = nextAreaId ? getAreaById(nextAreaId) : undefined;
    const description = mergePartnerMeta(partner.description, {
      neighborhood: area?.name || undefined,
      map_url: nextMapLink.trim() || undefined,
    });

    const { error, verifiedColumnMissing } = await savePartnerLocation(partner.id, {
      address: nextAddress.trim() || undefined,
      city_id: cityId,
      area_id: nextAreaId ?? undefined,
      latitude: nextLat,
      longitude: nextLng,
      location_verified: nextVerified,
      description,
    });

    if (error) {
      Alert.alert('Could not save location', error.message);
      return false;
    }

    await hapticSuccess();
    if (showSuccessAlert) {
      Alert.alert(
        'Location updated ✓',
        verifiedColumnMissing
          ? `${showSuccessAlert} Run migration 048 in Supabase to store the GPS verified flag.`
          : showSuccessAlert,
      );
    }
    await loadPartner();
    return true;
  };

  const onRecaptureGps = async () => {
    setLocating(true);
    const result = await capturePartnerLocation();

    if (!result.ok) {
      setLocating(false);
      Alert.alert(
        'Location',
        result.reason === 'permission'
          ? 'Enable location in Settings to re-capture your restaurant GPS.'
          : result.message ?? 'Could not get your location. Try again.',
      );
      return;
    }

    const nextAddress = result.address || address;
    const nextMapLink = buildGoogleMapsUrl(result.latitude, result.longitude);

    setLatitude(result.latitude);
    setLongitude(result.longitude);
    setHasCoords(true);
    setLocationVerified(true);
    setAreaId(result.areaId);
    setAddress(nextAddress);
    setMapLink(nextMapLink);

    await persistLocation({
      nextAddress,
      nextAreaId: result.areaId,
      nextLat: result.latitude,
      nextLng: result.longitude,
      nextVerified: true,
      nextMapLink,
      showSuccessAlert: 'Your restaurant GPS coordinates were saved.',
    });
    setLocating(false);
  };

  const onApplyMapLink = async () => {
    const trimmed = mapLink.trim();
    if (!trimmed) {
      Alert.alert('Map link', 'Paste a Google Maps or Apple Maps link first.');
      return;
    }

    setApplyingLink(true);
    const parsed = await resolveMapLink(trimmed);
    setApplyingLink(false);

    if (!parsed) {
      Alert.alert(
        'Could not read that link',
        'Paste a Google Maps link that includes coordinates, or open the place → Share → Copy link, then try again.\n\nYou can also paste coordinates like: 28.04000, 84.50000',
      );
      return;
    }

    setLatitude(parsed.latitude);
    setLongitude(parsed.longitude);
    setHasCoords(true);
    setLocationVerified(true);
    setAreaId(parsed.areaId);

    const normalizedLink = looksLikeMapLink(trimmed)
      ? trimmed
      : buildGoogleMapsUrl(parsed.latitude, parsed.longitude);
    setMapLink(normalizedLink);

    await persistLocation({
      nextAddress: address,
      nextAreaId: parsed.areaId,
      nextLat: parsed.latitude,
      nextLng: parsed.longitude,
      nextVerified: true,
      nextMapLink: normalizedLink,
      showSuccessAlert: 'Precise map pin saved from your link.',
    });
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

    // If they pasted a map link but forgot Apply, try once on save
    let nextLat = latitude;
    let nextLng = longitude;
    let nextAreaId = areaId;
    let nextVerified = locationVerified;
    let nextMapLink = mapLink.trim();

    if (nextMapLink) {
      const parsed = await resolveMapLink(nextMapLink);
      if (parsed) {
        nextLat = parsed.latitude;
        nextLng = parsed.longitude;
        nextAreaId = parsed.areaId;
        nextVerified = true;
        setLatitude(nextLat);
        setLongitude(nextLng);
        setAreaId(nextAreaId);
        setHasCoords(true);
        setLocationVerified(true);
      }
    }

    setSaving(true);
    const ok = await persistLocation({
      nextAddress: address.trim(),
      nextAreaId,
      nextLat,
      nextLng,
      nextVerified,
      nextMapLink,
    });
    setSaving(false);

    if (ok) router.back();
  };

  const openPreviewMaps = () => {
    const url = mapLink.trim() || buildGoogleMapsUrl(latitude, longitude);
    void Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open maps', 'Maps is not available on this device.');
    });
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
                  {locationVerified ? '✓ Precise pin set' : 'Manual address'}
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.label}>Full address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            style={[styles.input, styles.multiline]}
            placeholder="Street, landmark, building name..."
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Map link (optional)</Text>
          <Text style={styles.hint}>
            Paste a Google Maps or Apple Maps share link so customers get your exact pin.
          </Text>
          <TextInput
            value={mapLink}
            onChangeText={setMapLink}
            style={styles.input}
            placeholder="https://maps.google.com/… or 28.04, 84.50"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View style={styles.mapLinkActions}>
            <Pressable
              onPress={() => void onApplyMapLink()}
              disabled={applyingLink}
              style={({ pressed }) => [
                styles.applyLinkBtn,
                pressed && { opacity: 0.9 },
                applyingLink && { opacity: 0.7 },
              ]}>
              {applyingLink ? (
                <ActivityIndicator color={Palette.white} />
              ) : (
                <>
                  <Link2 size={16} color={Palette.white} strokeWidth={2.4} />
                  <Text style={styles.applyLinkText}>Apply map link</Text>
                </>
              )}
            </Pressable>
            {hasCoords ? (
              <Pressable
                onPress={openPreviewMaps}
                style={({ pressed }) => [styles.previewLinkBtn, pressed && { opacity: 0.9 }]}>
                <ExternalLink size={15} color={Palette.primary} strokeWidth={2.2} />
                <Text style={styles.previewLinkText}>Open in Maps</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.label}>City & area</Text>
          <LocationPicker
            value={areaId}
            onChange={(cityId, nextAreaId) => {
              setAreaId(nextAreaId);
              // Don't overwrite a precise GPS/map pin when only changing labels
              if (!locationVerified) {
                const nextArea = getAreaById(nextAreaId);
                if (nextArea) {
                  setLatitude(nextArea.latitude);
                  setLongitude(nextArea.longitude);
                  setHasCoords(true);
                }
              }
              void cityId;
            }}
            placeholder="Choose location"
          />

          {isExpoGo ? (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderTitle}>Precise pin</Text>
              <Text style={styles.mapCoords}>
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
              <Text style={styles.mapHint}>
                Use GPS or paste a Maps link above for the exact restaurant pin. Drag-to-adjust is
                available in a development build.
              </Text>
            </View>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderTitle}>Map pin</Text>
              <Text style={styles.mapCoords}>
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
              <Text style={styles.mapHint}>
                Paste a Maps share link or use GPS for the most accurate pin.
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
  hint: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginTop: -4,
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
  mapLinkActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  applyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D85A30',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 140,
    justifyContent: 'center',
  },
  applyLinkText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '700',
  },
  previewLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAECE7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  previewLinkText: {
    color: '#D85A30',
    fontSize: 13,
    fontWeight: '700',
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
