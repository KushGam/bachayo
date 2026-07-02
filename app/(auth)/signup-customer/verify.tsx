import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthReviewCard } from '@/components/auth/AuthReviewCard';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { signUpWithEmail } from '@/lib/auth';
import { getTabsRouteForRole } from '@/lib/navigation';
import { hapticSuccess } from '@/lib/haptics';
import { createCustomerProfile } from '@/lib/signupProfile';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 4;

export default function CustomerVerifyScreen() {
  const router = useRouter();
  const { customer, customerAuthMethod, signupPassword, resetCustomer } = useSignupStore();
  const { setAuthRole } = useAuthStore();
  const setLocation = useLocationStore((s) => s.setLocation);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!customer.fullName || !signupPassword) {
      router.replace('/(auth)/signup-customer/basics');
    }
  }, [customer.fullName, router, signupPassword]);

  const finishSignup = useCallback(async () => {
    await hapticSuccess();
    setLocation(customer.cityId, customer.areaId);
    setSuccess(true);
    setAuthRole('customer');
    setTimeout(() => {
      resetCustomer();
      router.replace(getTabsRouteForRole('customer'));
    }, 1800);
  }, [customer.areaId, customer.cityId, resetCustomer, router, setLocation, setAuthRole]);

  const onFinish = async () => {
    if (!signupPassword) return;

    setSubmitError(null);
    setLoading(true);

    try {
      let userId: string | null = null;

      if (customerAuthMethod === 'phone') {
        const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
        if (sessionError || !sessionData.user) {
          setSubmitError('Please verify your phone number first.');
          setLoading(false);
          return;
        }
        userId = sessionData.user.id;
      } else {
        const { data, error } = await signUpWithEmail(customer.email, signupPassword);
        if (error || !data.user) {
          setSubmitError(error?.message ?? 'Could not create your account.');
          setLoading(false);
          return;
        }
        userId = data.user.id;
      }

      const { error: profileError } = await createCustomerProfile(userId, customer);

      if (profileError) {
        setSubmitError(profileError.message ?? 'Could not create your profile.');
        setLoading(false);
        return;
      }

      setLoading(false);
      await finishSignup();
    } catch (err) {
      setLoading(false);
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (success) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.successGlow} />
        <Animated.View entering={ZoomIn.duration(400)} style={styles.successCard}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>
            Welcome to Bachayo, {customer.fullName.split(' ')[0]}!
          </Text>
          <Text style={styles.successSubtitle}>Finding rescue bags near you…</Text>
        </Animated.View>
      </View>
    );
  }

  const loginLabel =
    customerAuthMethod === 'email' ? customer.email : `+977 ${customer.phone}`;

  return (
    <SignupStepShell
      currentStep={4}
      totalSteps={TOTAL_STEPS}
      title="Almost there"
      subtitle="Review your account details before we finish"
      showBack
      onBack={() => router.back()}
      continueLabel="Finish signup"
      onContinue={onFinish}
      continueLoading={loading}>
      <AuthReviewCard
        authMethod={customerAuthMethod}
        identifier={loginLabel}
        name={customer.fullName}
      />

      <Text style={styles.copy}>
        Tap finish to create your Bachayo account. You can log in with
        {customerAuthMethod === 'email' ? ' this email' : ' this phone number'} and your password
        next time.
      </Text>

      {submitError ? <AuthErrorBanner message={submitError} /> : null}
    </SignupStepShell>
  );
}

const styles = StyleSheet.create({
  copy: {
    ...Type.body,
    color: Palette.textSecondary,
    lineHeight: 22,
    marginTop: Spacing.lg,
  },
  successScreen: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  successGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Palette.primaryLight,
    opacity: 0.6,
  },
  successCard: {
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  successEmoji: {
    fontSize: 56,
  },
  successTitle: {
    ...Type.h1,
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    ...Type.body,
    color: Palette.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
