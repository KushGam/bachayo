import * as Location from 'expo-location';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { FormField } from '@/components/auth/FormField';
import { SignupFieldGroup } from '@/components/auth/SignupFieldGroup';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { getAreaById } from '@/lib/locations';
import type { MapRegion } from '@/types/map';

type LocationFormFieldsProps = {
  areaId: string | null;
  onLocationChange: (cityId: string, areaId: string) => void;
  areaError?: string;
  address?: string;
  onAddressChange?: (value: string) => void;
  addressLabel?: string;
  addressHint?: string;
  addressPlaceholder?: string;
  addressRequired?: boolean;
  addressError?: string;
  website?: string;
  onWebsiteChange?: (value: string) => void;
  websiteError?: string;
  mapError?: string;
  latitude: number;
  longitude: number;
  onCoordsChange: (latitude: number, longitude: number) => void;
  region: MapRegion;
  onRegionChange: (region: MapRegion) => void;
};

export function LocationFormFields({
  areaId,
  onLocationChange,
  areaError,
  address,
  onAddressChange,
  addressLabel = 'Street address',
  addressHint,
  addressPlaceholder = 'Building, street, landmark',
  addressRequired = false,
  addressError,
  website,
  onWebsiteChange,
  websiteError,
  mapError,
  latitude,
  longitude,
  onCoordsChange,
  region,
  onRegionChange,
}: LocationFormFieldsProps) {
  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const location = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    onCoordsChange(coords.latitude, coords.longitude);
    onRegionChange({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
  };

  const handlePickerChange = (cityId: string, nextAreaId: string) => {
    onLocationChange(cityId, nextAreaId);
    const area = getAreaById(nextAreaId);
    if (area) {
      onCoordsChange(area.latitude, area.longitude);
      onRegionChange({
        latitude: area.latitude,
        longitude: area.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  return (
    <View style={styles.wrap}>
      <SignupFieldGroup
        label="City & area"
        hint="Choose where you usually eat or run your business"
        required>
        <LocationPicker
          value={areaId}
          onChange={handlePickerChange}
          error={areaError}
        />
      </SignupFieldGroup>

      {onAddressChange ? (
        <SignupFieldGroup
          label={addressLabel}
          hint={addressHint}
          required={addressRequired}>
          <FormField
            label=""
            hideLabel
            value={address ?? ''}
            onChangeText={onAddressChange}
            placeholder={addressPlaceholder}
            multiline
            numberOfLines={3}
            style={styles.addressInput}
            error={addressError}
          />
        </SignupFieldGroup>
      ) : null}

      {onWebsiteChange ? (
        <SignupFieldGroup
          label="Store website or social link"
          hint="Optional — website, Instagram, or Facebook page">
          <FormField
            label=""
            hideLabel
            value={website ?? ''}
            onChangeText={onWebsiteChange}
            placeholder="himalayankitchen.com or instagram.com/yourpage"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={200}
            error={websiteError}
          />
        </SignupFieldGroup>
      ) : null}

      <SignupFieldGroup
        label="Pin exact location"
        hint="Drag the pin so customers can find you easily"
        required>
        {Platform.OS !== 'web' ? (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackText}>
              Map pin picker needs a development build. Use current location below.
            </Text>
          </View>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackText}>Map preview available on mobile</Text>
          </View>
        )}
        <AuthButton
          label="Use my current location"
          variant="secondary"
          onPress={useCurrentLocation}
          style={styles.locationBtn}
        />
        {mapError ? <Text style={styles.mapError}>{mapError}</Text> : null}
      </SignupFieldGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  addressInput: {
    minHeight: 92,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  map: {
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  mapFallback: {
    height: 120,
    borderRadius: Radius.lg,
    backgroundColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  mapFallbackText: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  locationBtn: {
    marginBottom: 0,
  },
  mapError: {
    marginTop: Spacing.sm,
    ...Type.caption,
    color: Palette.danger,
    textAlign: 'center',
  },
});
