import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { OtpInput } from '@/components/auth/OtpInput';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { TermsCheckbox } from '@/components/auth/TermsCheckbox';
import { Screen } from '@/components/Screen';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { t } from '@/constants/i18n';
import { useSafeBack } from '@/hooks/useSafeBack';
import { formatNepalPhone, phoneProfileExists, upsertProfile } from '@/lib/auth';
import { confirmPhoneOtpOnly, requestPhoneOtpDetailed } from '@/lib/auth/otpClient';
import { getTabsRouteForRole } from '@/lib/navigation';
import { recordTermsAcceptance } from '@/lib/terms';
import { supabase } from '@/lib/supabase';
import { phoneSchema } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types/database';

const completeProfileSchema = z.object({
  phone: phoneSchema.shape.phone,
});

type CompleteProfileValues = z.infer<typeof completeProfileSchema>;
type Step = 'phone' | 'otp';

const RESEND_SECONDS = 60;

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { locale, pendingRole, setPendingRole, setAuthRole } = useAuthStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phoneTaken, setPhoneTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step, setStep] = useState<Step>('phone');
  const [pendingPhone, setPendingPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const goBack = useSafeBack('/(auth)/welcome');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { phone: '' },
  });

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace('/(auth)/welcome');
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? null);
      const name =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null;
      setDisplayName(name);
    });
  }, [router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const role: UserRole = pendingRole === 'partner' ? 'partner' : 'customer';

  const finishOnboarding = async (phoneDigits: string | null) => {
    if (!userId) return;

    const { error } = await upsertProfile(userId, phoneDigits, role, displayName);
    if (error) {
      setSubmitError(error.message || t(locale, 'authError'));
      return;
    }

    const { error: termsError } = await recordTermsAcceptance(userId);
    if (termsError) {
      setSubmitError(termsError.message || 'Could not save terms acceptance.');
      return;
    }

    setAuthRole(role);

    if (role === 'partner') {
      router.replace('/(auth)/signup-partner/basics');
      return;
    }

    router.replace(getTabsRouteForRole('customer'));
  };

  const sendCode = async (phone: string) => {
    if (!userId) return;

    if (!termsAccepted) {
      Alert.alert(
        'Please accept terms',
        'You must agree to our Terms of Service and Privacy Policy to continue.',
      );
      return;
    }

    setSubmitError(null);
    setPhoneTaken(false);
    setLoading(true);

    try {
      const exists = await phoneProfileExists(phone);
      if (exists) {
        setPhoneTaken(true);
        return;
      }

      const result = await requestPhoneOtpDetailed(formatNepalPhone(phone));
      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      setPendingPhone(phone);
      setOtpId(result.otp_id);
      setOtp('');
      setSecondsLeft(RESEND_SECONDS);
      setStep('otp');
    } catch {
      setSubmitError(t(locale, 'authError'));
    } finally {
      setLoading(false);
    }
  };

  const onSendOtp = handleSubmit(async ({ phone }) => {
    await sendCode(phone);
  });

  const onVerifyOtp = async (code: string) => {
    if (!userId || !otpId || code.length < 6) return;

    setSubmitError(null);
    setLoading(true);

    try {
      const result = await confirmPhoneOtpOnly(
        formatNepalPhone(pendingPhone),
        code,
        otpId,
      );
      if (!result.success) {
        setSubmitError(result.error || 'Invalid code. Please try again.');
        return;
      }

      await finishOnboarding(pendingPhone);
    } catch {
      setSubmitError(t(locale, 'authError'));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0 || !pendingPhone) return;
    setLoading(true);
    setSubmitError(null);
    const result = await requestPhoneOtpDetailed(formatNepalPhone(pendingPhone));
    setLoading(false);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    setOtpId(result.otp_id);
    setOtp('');
    setSecondsLeft(RESEND_SECONDS);
  };

  const onSkip = async () => {
    if (!userId) return;

    if (!termsAccepted) {
      Alert.alert(
        'Please accept terms',
        'You must agree to our Terms of Service and Privacy Policy to continue.',
      );
      return;
    }

    setSubmitError(null);
    setLoading(true);
    try {
      await finishOnboarding(null);
    } catch {
      setSubmitError(t(locale, 'authError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <Pressable
        onPress={() => {
          if (step === 'otp') {
            setStep('phone');
            setOtp('');
            setSubmitError(null);
            return;
          }
          goBack();
        }}
        style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>{step === 'otp' ? 'Verify your phone' : 'Almost there'}</Text>
        <Text style={styles.subtitle}>
          {step === 'otp'
            ? `Enter the 6-digit code sent to +977 ${pendingPhone}`
            : `${displayName ? `Hi ${displayName.split(' ')[0]}! ` : ''}Add a Nepal phone number for pickup updates. We’ll text you a code to confirm it.`}
        </Text>
        {userEmail && step === 'phone' ? (
          <Text style={styles.emailHint}>Signed in as {userEmail}</Text>
        ) : null}
      </View>

      {step === 'phone' ? (
        <>
          <View style={styles.roleRow}>
            <Pressable
              onPress={() => setPendingRole('customer')}
              style={[styles.roleChip, role === 'customer' && styles.roleChipActive]}>
              <Text style={[styles.roleChipText, role === 'customer' && styles.roleChipTextActive]}>
                I want rescue food
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPendingRole('partner')}
              style={[styles.roleChip, role === 'partner' && styles.roleChipActive]}>
              <Text style={[styles.roleChipText, role === 'partner' && styles.roleChipTextActive]}>
                I run a restaurant
              </Text>
            </Pressable>
          </View>

          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <PhoneInput
                value={value}
                onChange={onChange}
                placeholder={t(locale, 'phonePlaceholder')}
                error={errors.phone?.message ? t(locale, 'invalidPhone') : undefined}
              />
            )}
          />

          {phoneTaken ? (
            <View style={styles.inlineError}>
              <Text style={styles.errorText}>This number is already registered</Text>
              <AuthButton
                label="Log in instead"
                variant="secondary"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.altAction}
              />
            </View>
          ) : null}

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <TermsCheckbox
            accepted={termsAccepted}
            onToggle={() => setTermsAccepted((v) => !v)}
          />

          <AuthButton
            label="Send verification code"
            onPress={() => void onSendOtp()}
            loading={loading}
            disabled={!termsAccepted}
            style={styles.submit}
          />

          <Pressable
            onPress={() => void onSkip()}
            disabled={loading}
            style={styles.skipBtn}
            hitSlop={8}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
          <Text style={styles.skipHint}>
            You can add and verify a phone later in Profile. Needed for some pickup alerts.
          </Text>
        </>
      ) : (
        <>
          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (value.length >= 6) {
                void onVerifyOtp(value);
              }
            }}
            error={submitError ?? undefined}
          />

          <AuthButton
            label="Verify & continue"
            onPress={() => void onVerifyOtp(otp)}
            loading={loading}
            disabled={otp.length < 6}
            style={styles.submit}
          />

          <Pressable
            onPress={() => void onResend()}
            disabled={secondsLeft > 0 || loading}
            style={styles.skipBtn}
            hitSlop={8}>
            <Text style={[styles.skipText, secondsLeft > 0 && styles.skipDisabled]}>
              {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setStep('phone');
              setOtp('');
              setSubmitError(null);
            }}
            style={styles.skipBtn}
            hitSlop={8}>
            <Text style={styles.changePhone}>Change number</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xxl,
  },
  back: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    width: 40,
  },
  backText: {
    ...Type.h1,
    color: Palette.textPrimary,
  },
  header: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    ...Type.display,
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Type.body,
    color: Palette.textSecondary,
  },
  emailHint: {
    ...Type.caption,
    color: Palette.textTertiary,
    marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  roleChip: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: Border.width,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.lightGreenBg,
  },
  roleChipText: {
    ...Type.label,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  roleChipTextActive: {
    color: Palette.primaryDark,
  },
  submit: {
    marginTop: Spacing.lg,
  },
  inlineError: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Type.bodyMedium,
    color: Palette.danger,
    textAlign: 'center',
  },
  submitError: {
    ...Type.bodyMedium,
    color: Palette.danger,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  altAction: {
    marginTop: 0,
  },
  skipBtn: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  skipText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '600',
  },
  skipDisabled: {
    color: Palette.textTertiary,
  },
  skipHint: {
    ...Type.caption,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  changePhone: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
});
