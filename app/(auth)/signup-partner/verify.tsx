import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthReviewCard } from '@/components/auth/AuthReviewCard';
import { OtpInput } from '@/components/auth/OtpInput';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import {
  resendEmailSignupOtp,
  sendEmailSignupOtp,
  verifyEmailSignupOtp,
} from '@/lib/auth';
import { friendlyAuthError } from '@/lib/auth/authErrors';
import { hapticSuccess } from '@/lib/haptics';
import { createPartnerAccount } from '@/lib/signupProfile';
import { markTermsAcceptedLocally } from '@/lib/terms';
import { supabase } from '@/lib/supabase';
import { resolvePartnerCoverUrl } from '@/lib/images';
import { useAuthStore } from '@/store/useAuthStore';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 5;
const EMAIL_OTP_LENGTH = 8;
const RESEND_SECONDS = 60;

export default function PartnerVerifyScreen() {
  const router = useRouter();
  const { partner, partnerAuthMethod, signupPassword, termsAccepted, resetPartner } =
    useSignupStore();
  const { setAuthRole } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [needsEmailOtp, setNeedsEmailOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const otpBootstrapRef = useRef(false);

  const isEmail = partnerAuthMethod === 'email';

  useEffect(() => {
    if (!partner.ownerName || !signupPassword) {
      router.replace('/(auth)/signup-partner/basics');
    }
  }, [partner.ownerName, router, signupPassword]);

  const bootstrapEmailOtp = useCallback(async () => {
    if (!isEmail || !signupPassword || !partner.email || otpBootstrapRef.current) {
      return;
    }
    otpBootstrapRef.current = true;
    setSendingOtp(true);
    setSubmitError(null);
    setNeedsEmailOtp(true);

    try {
      const result = await sendEmailSignupOtp(partner.email, signupPassword);
      if (result.status === 'otp_sent') {
        setResendSeconds(RESEND_SECONDS);
      } else {
        setSubmitError(
          friendlyAuthError(result.error, 'Could not send verification email.'),
        );
        otpBootstrapRef.current = false;
      }
    } finally {
      setSendingOtp(false);
    }
  }, [isEmail, partner.email, signupPassword]);

  useEffect(() => {
    void bootstrapEmailOtp();
  }, [bootstrapEmailOtp]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendSeconds]);

  const onResendEmailOtp = async () => {
    if (!partner.email || !signupPassword || resendSeconds > 0 || sendingOtp) return;
    setSendingOtp(true);
    setSubmitError(null);
    try {
      const result = await resendEmailSignupOtp(partner.email, signupPassword);
      if (result.status === 'error') {
        setSubmitError(friendlyAuthError(result.error, 'Could not resend code.'));
      } else {
        setEmailOtp('');
        setResendSeconds(RESEND_SECONDS);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const finishSignup = useCallback(async () => {
    await hapticSuccess();
    setSuccess(true);
    setAuthRole('partner');
    setTimeout(() => {
      resetPartner();
      router.replace('/(auth)/partner-pending');
    }, 2200);
  }, [resetPartner, router, setAuthRole]);

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
        if (emailOtp.replace(/\D/g, '').length < 6) {
          Alert.alert('Invalid code', 'Enter the full code from your email.');
          setLoading(false);
          return;
        }
        const { user, error } = await verifyEmailSignupOtp(partner.email, emailOtp);
        if (error || !user) {
          const message = friendlyAuthError(error, 'Invalid code. Please try again.');
          setEmailOtp('');
          setSubmitError(message);
          Alert.alert('Invalid code', message);
          setLoading(false);
          return;
        }
        userId = user.id;
      }

      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) {
        setSubmitError('Could not start your session. Please try logging in.');
        setLoading(false);
        return;
      }

      let coverUrl: string | null = null;
      if (partner.coverUri) {
        coverUrl = await resolvePartnerCoverUrl(userId, partner.coverUri);
      }

      const { error: accountError } = await createPartnerAccount(
        userId,
        partner,
        coverUrl,
        termsAccepted,
      );

      if (accountError) {
        setSubmitError(
          friendlyAuthError(
            accountError,
            accountError.message?.toLowerCase().includes('row-level security')
              ? 'Could not save your profile. Please try again or log in.'
              : 'Could not create your restaurant profile.',
          ),
        );
        setLoading(false);
        return;
      }

      if (termsAccepted) {
        await markTermsAcceptedLocally(userId);
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
          <Text style={styles.successTitle}>Application submitted!</Text>
          <Text style={styles.successSubtitle}>
            We&apos;ll review your restaurant within 24 hours
          </Text>
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
      subtitle={
        isEmail && needsEmailOtp
          ? 'Enter the code we emailed you, then finish'
          : 'Review your account before we go live'
      }
      showBack
      onBack={() => router.back()}
      continueLabel="Finish signup"
      onContinue={onFinish}
      continueLoading={loading || sendingOtp}
      continueDisabled={
        isEmail && needsEmailOtp && emailOtp.replace(/\D/g, '').length < 6
      }>
      <AuthReviewCard
        authMethod={partnerAuthMethod}
        identifier={loginLabel}
        name={partner.ownerName}
      />

      {isEmail && needsEmailOtp ? (
        <View style={styles.otpBlock}>
          <Text style={styles.otpLabel}>Email verification code</Text>
          <Text style={styles.otpHint}>
            We sent an {EMAIL_OTP_LENGTH}-digit code to {partner.email}
          </Text>
          <OtpInput
            value={emailOtp}
            onChange={(value) => {
              setEmailOtp(value);
              setSubmitError(null);
            }}
            length={EMAIL_OTP_LENGTH}
            autoComplete="one-time-code"
            error={submitError ?? undefined}
          />
          <Pressable
            onPress={onResendEmailOtp}
            disabled={resendSeconds > 0 || sendingOtp}
            style={styles.resendBtn}>
            <Text
              style={[
                styles.resendText,
                (resendSeconds > 0 || sendingOtp) && styles.resendDisabled,
              ]}>
              {resendSeconds > 0
                ? `Resend code in ${resendSeconds}s`
                : sendingOtp
                  ? 'Sending…'
                  : 'Resend code'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.copy}>
          Tap finish to create your partner account with the password you chose.
        </Text>
      )}

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
  otpBlock: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  otpLabel: {
    ...Type.bodyMedium,
    color: Palette.textPrimary,
    fontWeight: '700',
  },
  otpHint: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginBottom: Spacing.sm,
  },
  resendBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
  },
  resendText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '600',
  },
  resendDisabled: {
    color: Palette.textSecondary,
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
