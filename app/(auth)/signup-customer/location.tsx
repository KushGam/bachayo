import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { getNeighbourhood } from '@/lib/geocoding';
import { hapticStepAdvance } from '@/lib/haptics';
import { findNearestLocation } from '@/lib/locations';
import { useLocationStore } from '@/store/useLocationStore';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 4;

export default function CustomerLocationScreen() {
  const router = useRouter();
  const { customerAuthMethod, phoneOtpVerified, setCustomer } = useSignupStore();
  const requestLocation = useLocationStore((s) => s.requestLocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (customerAuthMethod === 'phone' && !phoneOtpVerified) {
      router.replace('/(auth)/signup-customer/basics');
    }
  }, [customerAuthMethod, phoneOtpVerified, router]);

  const enableLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const ok = await requestLocation();
      if (!ok) {
        setGranted(false);
        setError('Location permission is needed to show bags near you.');
        return;
      }

      const { latitude, longitude, neighbourhood } = useLocationStore.getState();
      if (latitude == null || longitude == null) {
        setError('Could not read your location. Try again.');
        return;
      }

      const nearest = findNearestLocation(latitude, longitude);
      const place =
        neighbourhood || (await getNeighbourhood(latitude, longitude));

      setCustomer({
        cityId: nearest.cityId,
        areaId: nearest.areaId,
        homeAddress: place,
        homeLatitude: latitude,
        homeLongitude: longitude,
      });
      setLabel(place);
      setGranted(true);
    } catch {
      setError('Could not get your location. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onContinue = async () => {
    if (!granted) {
      setError('Allow location access to continue.');
      return;
    }
    await hapticStepAdvance();
    router.push('/(auth)/signup-customer/preferences');
  };

  return (
    <SignupStepShell
      currentStep={2}
      totalSteps={TOTAL_STEPS}
      title="Allow location access"
      subtitle="We'll show rescue bags near you automatically"
      showBack
      onBack={() => router.back()}
      onContinue={onContinue}
      continueDisabled={!granted || loading}>
      <View style={styles.card}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.title}>Find bags near you</Text>
        <Text style={styles.body}>
          LastBag uses your GPS location to show nearby rescue bags. We never store or share your
          precise location with restaurants.
        </Text>

        {label ? (
          <Text style={styles.detected}>📍 {label}</Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={() => void enableLocation()}
          disabled={loading}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {granted ? 'Location enabled ✓' : 'Allow location access'}
            </Text>
          )}
        </Pressable>
      </View>
    </SignupStepShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F3EF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  body: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  detected: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
  error: {
    marginTop: Spacing.sm,
    color: Palette.danger,
    textAlign: 'center',
    fontSize: 13,
  },
  btn: {
    marginTop: Spacing.lg,
    backgroundColor: Palette.primary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  btnText: {
    color: Palette.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
