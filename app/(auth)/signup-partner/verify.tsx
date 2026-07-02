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
import { createPartnerAccount } from '@/lib/signupProfile';
import { supabase } from '@/lib/supabase';
import { resolvePartnerCoverUrl } from '@/lib/images';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 5;

export default function PartnerVerifyScreen() {
  const router = useRouter();
  const { partner, partnerAuthMethod, signupPassword, resetPartner } = useSignupStore();
  const { setAuthRole } = useAuthStore();
  const setLocation = useLocationStore((s) => s.setLocation);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!partner.ownerName || !signupPassword) {
      router.replace('/(auth)/signup-partner/basics');
    }
  }, [partner.ownerName, router, signupPassword]);

  const finishSignup = useCallback(async () => {
    await hapticSuccess();
    setLocation(partner.cityId, partner.areaId);
    setSuccess(true);
    setAuthRole('partner');
    setTimeout(() => {
      resetPartner();
      router.replace(getTabsRouteForRole('partner'));
    }, 2200);
  }, [partner.areaId, partner.cityId, resetPartner, router, setLocation, setAuthRole]);

  const onFinish = async () => {
    if (!signupPassword) return;

    setSubmitError(null);
    setLoading(true);

    try {
      let userId: string | null = null;

      if (partnerAuthMethod === 'phone') {
        const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
        if (sessionError || !sessionData.user) {
          setSubmitError('Please verify your phone number first.');
          setLoading(false);
          return;
        }
        userId = sessionData.user.id;
      } else {
        const { data, error } = await signUpWithEmail(partner.email, signupPassword);
        if (error || !data.user) {
          setSubmitError(error?.message ?? 'Could not create your account.');
          setLoading(false);
          return;
        }
        userId = data.user.id;
      }

      let coverUrl: string | null = null;
      if (partner.coverUri) {
        coverUrl = await resolvePartnerCoverUrl(userId, partner.coverUri);
      }

      const { error: accountError } = await createPartnerAccount(userId, partner, coverUrl);

      if (accountError) {
        setSubmitError(accountError.message ?? 'Could not create your restaurant profile.');
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
          <Text style={styles.successTitle}>Your restaurant is registered!</Text>
          <Text style={styles.successSubtitle}>Next: add your first rescue bag</Text>
        </Animated.View>
      </View>
    );
  }

  const loginLabel = partnerAuthMethod === 'email' ? partner.email : `+977 ${partner.phone}`;

  return (
    <SignupStepShell
      currentStep={5}
      totalSteps={TOTAL_STEPS}
      title="Almost there"
      subtitle="Review your account before we go live"
      showBack
      onBack={() => router.back()}
      continueLabel="Finish signup"
      onContinue={onFinish}
      continueLoading={loading}>
      <AuthReviewCard
        authMethod={partnerAuthMethod}
        identifier={loginLabel}
        name={partner.ownerName}
      />

      <Text style={styles.copy}>
        Tap finish to create your partner account with the password you chose.
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
