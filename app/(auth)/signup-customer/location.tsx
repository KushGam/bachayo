import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import type { MapRegion } from '@/types/map';

import { LocationFormFields } from '@/components/auth/LocationFormFields';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { getAreaById } from '@/lib/locations';
import { hapticStepAdvance } from '@/lib/haptics';
import { customerLocationSchema } from '@/lib/validation/signup';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 4;

export default function CustomerLocationScreen() {
  const router = useRouter();
  const { customer, customerAuthMethod, phoneOtpVerified, setCustomer } = useSignupStore();
  const [cityId, setCityId] = useState(customer.cityId);
  const [areaId, setAreaId] = useState<string | null>(customer.areaId);
  const [address, setAddress] = useState(customer.homeAddress);
  const [coords, setCoords] = useState({
    latitude: customer.homeLatitude,
    longitude: customer.homeLongitude,
  });
  const [region, setRegion] = useState<MapRegion>({
    ...coords,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [fieldErrors, setFieldErrors] = useState<{
    area?: string;
    address?: string;
  }>({});

  useEffect(() => {
    if (customerAuthMethod === 'phone' && !phoneOtpVerified) {
      router.replace('/(auth)/signup-customer/basics');
    }
  }, [customerAuthMethod, phoneOtpVerified, router]);

  const onContinue = async () => {
    const parsed = customerLocationSchema.safeParse({
      cityId,
      areaId,
      homeAddress: address,
      homeLatitude: coords.latitude,
      homeLongitude: coords.longitude,
    });

    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        area: issues.areaId?.[0] ?? issues.cityId?.[0],
      });
      return;
    }

    const area = getAreaById(parsed.data.areaId);
    setFieldErrors({});
    setCustomer({
      cityId: parsed.data.cityId,
      areaId: parsed.data.areaId,
      homeAddress: parsed.data.homeAddress?.trim() || area?.name || '',
      homeLatitude: parsed.data.homeLatitude,
      homeLongitude: parsed.data.homeLongitude,
    });
    await hapticStepAdvance();
    router.push('/(auth)/signup-customer/preferences');
  };

  const handleLocationChange = (nextCityId: string, nextAreaId: string) => {
    setCityId(nextCityId);
    setAreaId(nextAreaId);
    setFieldErrors((prev) => ({ ...prev, area: undefined }));
  };

  return (
    <SignupStepShell
      currentStep={2}
      totalSteps={TOTAL_STEPS}
      title="Where do you usually eat?"
      subtitle="We'll show you rescue bags near here first"
      showBack
      onBack={() => router.back()}
      onContinue={onContinue}
      continueDisabled={!areaId}>
      <LocationFormFields
        areaId={areaId}
        onLocationChange={handleLocationChange}
        areaError={fieldErrors.area}
        address={address}
        onAddressChange={(value) => {
          setAddress(value);
          setFieldErrors((prev) => ({ ...prev, address: undefined }));
        }}
        addressLabel="Home address"
        addressHint="Optional — helps us show bags closest to you"
        addressPlaceholder="Street, tole, or landmark near you"
        addressError={fieldErrors.address}
        latitude={coords.latitude}
        longitude={coords.longitude}
        onCoordsChange={(latitude, longitude) => setCoords({ latitude, longitude })}
        region={region}
        onRegionChange={setRegion}
      />
    </SignupStepShell>
  );
}
