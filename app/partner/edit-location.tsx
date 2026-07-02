import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { mergePartnerMeta } from '@/lib/partnerMeta';
import type { PartnerProfileRow } from '@/lib/partnerProfile';
import { supabase } from '@/lib/supabase';

const isExpoGo = Constants.appOwnership === 'expo';

export default function EditLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [partner, setPartner] = useState<PartnerProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState('');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [latitude, setLatitude] = useState(27.7172);
  const [longitude, setLongitude] = useState(85.324);

  const loadPartner = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.from('partners').select('*').eq('user_id', userId).maybeSingle();
    if (data) {
      const row = data as PartnerProfileRow;
      setPartner(row);
      setAddress(row.address?.split(',')[0]?.trim() ?? row.address ?? '');
      setAreaId(row.area_id ?? null);
      setLatitude(row.latitude ?? 27.7172);
      setLongitude(row.longitude ?? 85.324);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

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
    const fullAddress = [address.trim(), areaLabel, cityLabel].filter(Boolean).join(', ');

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
        description,
      })
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

      <KeyboardAwareScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Full address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
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
              const nextArea = getAreaById(nextAreaId);
              if (nextArea) {
                setLatitude(nextArea.latitude);
                setLongitude(nextArea.longitude);
              }
              void cityId;
            }}
            placeholder="Choose location"
          />

          {isExpoGo ? (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderTitle}>Map pin adjustment available in the full app</Text>
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
  formCard: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 20,
    gap: 10,
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
