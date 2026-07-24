import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MapRegion } from '@/types/map';

import { LocationFormFields } from '@/components/auth/LocationFormFields';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { formatLocationLabel } from '@/lib/locations';
import { hapticStepAdvance } from '@/lib/haptics';
import { partnerLocationSchema } from '@/lib/validation/signup';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 5;

export default function PartnerLocationScreen() {
  const router = useRouter();
  const { partner, setPartner } = useSignupStore();
  const [address, setAddress] = useState(partner.address);
  const [website, setWebsite] = useState(partner.website);
  const [cityId, setCityId] = useState(partner.cityId);
  const [areaId, setAreaId] = useState<string | null>(partner.areaId);
  const [coords, setCoords] = useState({
    latitude: partner.latitude,
    longitude: partner.longitude,
  });
  const [region, setRegion] = useState<MapRegion>({
    ...coords,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [fieldErrors, setFieldErrors] = useState<{
    area?: string;
    address?: string;
    website?: string;
    latitude?: string;
  }>({});

  const locationLabel = areaId ? formatLocationLabel(cityId, areaId) : null;

  const preview = useMemo(() => {
    const lines = [
      partner.businessName ? `Store: ${partner.businessName}` : null,
      locationLabel ? `Location: ${locationLabel}` : null,
      address.trim() ? `Address: ${address.trim()}` : null,
      website.trim() ? `Web: ${website.trim()}` : null,
    ].filter(Boolean);
    return lines;
  }, [address, locationLabel, partner.businessName, website]);

  const onContinue = async () => {
    const parsed = partnerLocationSchema.safeParse({
      address,
      cityId,
      areaId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      website,
    });

    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        area: issues.areaId?.[0] ?? issues.cityId?.[0],
        address: issues.address?.[0],
        website: issues.website?.[0],
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
      website: parsed.data.website.trim(),
    });
    await hapticStepAdvance();
    router.push('/(auth)/signup-partner/hours-photo');
  };

  const handleLocationChange = (nextCityId: string, nextAreaId: string) => {
    setCityId(nextCityId);
    setAreaId(nextAreaId);
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

      <LocationFormFields
        areaId={areaId}
        onLocationChange={handleLocationChange}
        areaError={fieldErrors.area}
        address={address}
        onAddressChange={(value) => {
          setAddress(value);
          setFieldErrors((prev) => ({ ...prev, address: undefined }));
        }}
        addressLabel="Store address"
        addressHint="Building name, street, tole, and a nearby landmark"
        addressPlaceholder="e.g. Tridevi Marg, Thamel — near Kathmandu Guest House"
        addressRequired
        addressError={fieldErrors.address}
        website={website}
        onWebsiteChange={(value) => {
          setWebsite(value);
          setFieldErrors((prev) => ({ ...prev, website: undefined }));
        }}
        websiteError={fieldErrors.website}
        mapError={fieldErrors.latitude}
        latitude={coords.latitude}
        longitude={coords.longitude}
        onCoordsChange={(latitude, longitude) => {
          setCoords({ latitude, longitude });
          setFieldErrors((prev) => ({ ...prev, latitude: undefined }));
        }}
        region={region}
        onRegionChange={setRegion}
      />

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
