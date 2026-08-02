import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SignupFieldGroup } from '@/components/auth/SignupFieldGroup';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { formatLocationLabel, getAreaById } from '@/lib/locations';
import { capturePartnerLocation } from '@/lib/partnerGps';
import { hapticStepAdvance } from '@/lib/haptics';
import { partnerLocationSchema } from '@/lib/validation/signup';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 5;

export default function PartnerLocationScreen() {
  const router = useRouter();
  const { partner, setPartner } = useSignupStore();
  const [address, setAddress] = useState(partner.address);
  const [cityId, setCityId] = useState(partner.cityId);
  const [areaId, setAreaId] = useState<string | null>(partner.areaId);
  const [coords, setCoords] = useState({
    latitude: partner.latitude,
    longitude: partner.longitude,
  });
  const [locationCaptured, setLocationCaptured] = useState(partner.locationVerified);
  const [locating, setLocating] = useState(false);
  const [locationMethod, setLocationMethod] = useState<'gps' | 'manual'>(
    partner.locationVerified ? 'gps' : 'gps',
  );
  const [fieldErrors, setFieldErrors] = useState<{
    area?: string;
    address?: string;
    latitude?: string;
  }>({});

  const locationLabel = areaId ? formatLocationLabel(cityId, areaId) : null;

  const preview = useMemo(() => {
    const lines = [
      partner.businessName ? `Store: ${partner.businessName}` : null,
      locationLabel ? `Location: ${locationLabel}` : null,
      address.trim() ? `Address: ${address.trim()}` : null,
      locationCaptured ? 'GPS: verified' : null,
    ].filter(Boolean);
    return lines;
  }, [address, locationCaptured, locationLabel, partner.businessName]);

  const onCaptureGps = async () => {
    setLocating(true);
    setFieldErrors((prev) => ({ ...prev, latitude: undefined }));
    const result = await capturePartnerLocation();
    setLocating(false);

    if (!result.ok) {
      setLocationMethod('manual');
      setLocationCaptured(false);
      if (result.reason === 'permission') {
        setFieldErrors((prev) => ({
          ...prev,
          latitude: 'Location permission denied — enter your address manually below',
        }));
      }
      return;
    }

    setCoords({ latitude: result.latitude, longitude: result.longitude });
    setCityId(result.cityId);
    setAreaId(result.areaId);
    if (result.address) {
      setAddress(result.address);
    }
    setLocationCaptured(true);
    setLocationMethod('gps');
    setFieldErrors((prev) => ({ ...prev, address: undefined, area: undefined, latitude: undefined }));
  };

  const onContinue = async () => {
    const parsed = partnerLocationSchema.safeParse({
      address,
      cityId,
      areaId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      locationVerified: locationCaptured,
    });

    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        area: issues.areaId?.[0] ?? issues.cityId?.[0],
        address: issues.address?.[0],
        latitude: issues.latitude?.[0],
      });
      return;
    }

    setFieldErrors({});
    setPartner({
      address: parsed.data.address,
      cityId: parsed.data.cityId,
      areaId: parsed.data.areaId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      locationVerified: Boolean(parsed.data.locationVerified),
    });
    await hapticStepAdvance();
    router.push('/(auth)/signup-partner/hours-photo');
  };

  const handleLocationChange = (nextCityId: string, nextAreaId: string) => {
    setCityId(nextCityId);
    setAreaId(nextAreaId);
    setLocationCaptured(false);
    setLocationMethod('manual');
    const area = getAreaById(nextAreaId);
    if (area) {
      setCoords({ latitude: area.latitude, longitude: area.longitude });
    }
    setFieldErrors((prev) => ({ ...prev, area: undefined }));
  };

  const hasRequiredFields = Boolean(areaId && address.trim().length >= 10);

  return (
    <SignupStepShell
      currentStep={3}
      totalSteps={TOTAL_STEPS}
      title="Where's your business located?"
      showBack
      onBack={() => router.back()}
      onContinue={onContinue}
      continueDisabled={!hasRequiredFields}>
      {preview.length > 0 ? (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Your store details</Text>
          {preview.map((line) => (
            <Text key={line} style={styles.previewLine}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      {/* Option 1 — GPS */}
      <View
        style={[
          styles.gpsCard,
          locationCaptured && styles.gpsCardSuccess,
        ]}>
        <Text style={styles.gpsEmoji}>📍</Text>
        {locationCaptured ? (
          <>
            <Text style={styles.gpsSuccessTitle}>✓ Location captured!</Text>
            <Text style={styles.gpsCoords}>
              {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </Text>
            {address.trim() ? (
              <Text style={styles.gpsAddress}>{address.trim()}</Text>
            ) : null}
            <Pressable
              onPress={() => {
                setLocationCaptured(false);
                setLocationMethod('gps');
              }}
              hitSlop={8}
              style={styles.gpsReset}>
              <Text style={styles.gpsResetText}>Use different location</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.gpsTitle}>Use my current location</Text>
            <Text style={styles.gpsSubtitle}>
              We&apos;ll detect your restaurant&apos;s exact location automatically
            </Text>
            <Pressable
              onPress={() => void onCaptureGps()}
              disabled={locating}
              style={({ pressed }) => [
                styles.gpsButton,
                locating && styles.gpsButtonDisabled,
                pressed && !locating && { opacity: 0.92 },
              ]}>
              {locating ? (
                <View style={styles.gpsButtonRow}>
                  <ActivityIndicator color={Palette.white} />
                  <Text style={styles.gpsButtonText}>Getting location...</Text>
                </View>
              ) : (
                <Text style={styles.gpsButtonText}>Detect location →</Text>
              )}
            </Pressable>
          </>
        )}
      </View>

      {/* Option 2 — Manual */}
      <View style={styles.manualCard}>
        <Text style={styles.manualTitle}>Can&apos;t use GPS?</Text>
        <Text style={styles.manualSubtitle}>Enter your address manually below</Text>

        <SignupFieldGroup
          label="City & area"
          hint="Helps customers find you in search"
          required>
          <LocationPicker
            value={areaId}
            onChange={handleLocationChange}
            error={fieldErrors.area}
          />
        </SignupFieldGroup>

        <SignupFieldGroup
          label="Store address"
          hint="Building name, street, tole, and a nearby landmark"
          required>
          <TextInput
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              setLocationCaptured(false);
              setLocationMethod('manual');
              setFieldErrors((prev) => ({ ...prev, address: undefined }));
            }}
            placeholder="e.g. Thamel Marg, near Fire Club, Kathmandu"
            placeholderTextColor={Palette.textTertiary}
            multiline
            textAlignVertical="top"
            style={[styles.addressInput, fieldErrors.address ? styles.inputError : null]}
          />
          {fieldErrors.address ? (
            <Text style={styles.fieldError}>{fieldErrors.address}</Text>
          ) : null}
        </SignupFieldGroup>

        {locationMethod === 'manual' && !locationCaptured ? (
          <Pressable
            onPress={() => void onCaptureGps()}
            disabled={locating}
            hitSlop={6}
            style={styles.findMapLink}>
            <Text style={styles.findMapText}>
              {locating ? 'Getting GPS…' : 'Find on map →'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.nepalNote}>
        <Text style={styles.nepalNoteText}>
          🇳🇵 LastBag is available across Nepal. Customers near your restaurant will see your bags
          automatically.
        </Text>
      </View>

      {fieldErrors.latitude ? <Text style={styles.error}>{fieldErrors.latitude}</Text> : null}
    </SignupStepShell>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    backgroundColor: Palette.lightGreenBg,
    borderRadius: Radius.lg,
    borderWidth: Border.width,
    borderColor: Palette.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  previewTitle: {
    ...Type.label,
    fontWeight: '800',
    color: Palette.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  previewLine: {
    ...Type.caption,
    color: Palette.primaryDark,
    fontWeight: '600',
  },
  gpsCard: {
    backgroundColor: '#FAECE7',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#D85A30',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  gpsCardSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  gpsEmoji: {
    fontSize: 32,
  },
  gpsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
    textAlign: 'center',
  },
  gpsSubtitle: {
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  gpsButton: {
    backgroundColor: '#D85A30',
    height: 48,
    borderRadius: 999,
    marginTop: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  gpsButtonDisabled: {
    opacity: 0.75,
  },
  gpsButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gpsButtonText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '700',
  },
  gpsSuccessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 8,
    textAlign: 'center',
  },
  gpsCoords: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Menlo',
    marginTop: 6,
  },
  gpsAddress: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  gpsReset: {
    marginTop: 8,
  },
  gpsResetText: {
    color: '#D85A30',
    fontSize: 12,
    fontWeight: '600',
  },
  manualCard: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  manualTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  manualSubtitle: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginBottom: Spacing.md,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 80,
    backgroundColor: Palette.white,
  },
  inputError: {
    borderColor: Palette.danger,
  },
  fieldError: {
    ...Type.caption,
    color: Palette.danger,
    marginTop: 4,
  },
  findMapLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  findMapText: {
    color: '#D85A30',
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    ...Type.bodyMedium,
    color: Palette.danger,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  nepalNote: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  nepalNoteText: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 18,
  },
});
