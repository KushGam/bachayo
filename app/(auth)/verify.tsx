import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { OtpInput } from '@/components/auth/OtpInput';
import { Screen } from '@/components/Screen';
import { t } from '@/constants/i18n';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import {
  fetchProfileByUserId,
  sendPhoneOtp,
  setAuthPassword,
  verifyPhoneOtp,
} from '@/lib/auth';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { useSafeBack } from '@/hooks/useSafeBack';
import { otpSchema, type OtpFormValues } from '@/lib/validation/auth';
import { useAuthStore, type AuthMode } from '@/store/useAuthStore';
import { useSignupStore } from '@/store/useSignupStore';
import type { UserRole } from '@/types/database';

const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; role?: string; name?: string }>();
  const {
    locale,
    pendingPhone,
    pendingRole,
    pendingMode,
    pendingName,
    setPendingMode,
    setPendingRole,
    setPendingName,
    setAuthRole,
  } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const mode: AuthMode =
    params.mode === 'signup' || pendingMode === 'signup' ? 'signup' : 'login';
  const role: UserRole =
    params.role === 'partner' || pendingRole === 'partner' ? 'partner' : 'customer';

  const signupBasicsPath =
    role === 'partner' ? '/(auth)/signup-partner/basics' : '/(auth)/signup-customer/basics';

  const goBack = useSafeBack(mode === 'signup' ? signupBasicsPath : '/(auth)/login');

  useEffect(() => {
    if (params.mode === 'login' || params.mode === 'signup') {
      setPendingMode(params.mode);
    }
    if (params.role === 'partner' || params.role === 'customer') {
      setPendingRole(params.role);
    }
    if (params.name) {
      setPendingName(params.name);
    }
  }, [params.mode, params.name, params.role, setPendingMode, setPendingName, setPendingRole]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (!pendingPhone) {
      router.replace(mode === 'signup' ? signupBasicsPath : '/(auth)/login');
    }
  }, [mode, pendingPhone, router, signupBasicsPath]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const redirectAfterLogin = useCallback(
    async (userId: string) => {
      const profile = await fetchProfileByUserId(userId);

      if (!profile) {
        setSubmitError('No account found with this number');
        return;
      }

      const profileRole = profile.role ?? 'customer';
      setAuthRole(profileRole);
      router.replace(await resolveAuthenticatedRoute(userId, profileRole));
    },
    [router, setAuthRole],
  );

  const redirectAfterSignup = useCallback(async () => {
    const { signupPassword, setPhoneOtpVerified } = useSignupStore.getState();

    if (signupPassword) {
      const { error: passwordError } = await setAuthPassword(signupPassword);
      if (passwordError) {
        setSubmitError(passwordError.message || t(locale, 'authError'));
        return false;
      }
    }

    setPhoneOtpVerified(true);

    if (role === 'partner') {
      router.replace('/(auth)/signup-partner/business');
      return true;
    }

    router.replace('/(auth)/signup-customer/location');
    return true;
  }, [locale, role, router]);

  const onSubmit = async ({ otp }: OtpFormValues) => {
    if (!pendingPhone) return;

    setSubmitError(null);
    setLoading(true);

    const { data, error } = await verifyPhoneOtp(pendingPhone, otp);

    if (error || !data.user) {
      setLoading(false);
      setSubmitError(error?.message || t(locale, 'otpInvalid'));
      return;
    }

    if (mode === 'login') {
      setLoading(false);
      await redirectAfterLogin(data.user.id);
      return;
    }

    setLoading(false);
    await redirectAfterSignup();
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || !pendingPhone) return;

    setSubmitError(null);
    const { error } = await sendPhoneOtp(pendingPhone);

    if (error) {
      setSubmitError(error.message || t(locale, 'authError'));
      return;
    }

    setSecondsLeft(RESEND_SECONDS);
  };

  if (!pendingPhone) {
    return null;
  }

  return (
    <Screen contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <Pressable onPress={goBack} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>{t(locale, 'verifyTitle')}</Text>
        <Text style={styles.subtitle}>
          {t(locale, 'verifySubtitle', { phone: pendingPhone })}
        </Text>
      </View>

      <Controller
        control={control}
        name="otp"
        render={({ field: { value, onChange } }) => (
          <OtpInput
            value={value}
            onChange={onChange}
            error={
              errors.otp?.message
                ? t(locale, 'otpRequired')
                : submitError && !loading
                  ? submitError
                  : undefined
            }
          />
        )}
      />

      <AuthButton
        label={t(locale, 'verify')}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        style={styles.verifyBtn}
      />

      <Pressable onPress={handleResend} disabled={secondsLeft > 0} style={styles.resend}>
        <Text style={[styles.resendText, secondsLeft > 0 && styles.resendDisabled]}>
          {secondsLeft > 0
            ? t(locale, 'resendIn', { seconds: secondsLeft })
            : t(locale, 'resendOtp')}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xxl,
  },
  back: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    width: 40,
  },
  backText: {
    ...Type.h1,
    color: Palette.textPrimary,
  },
  header: {
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  title: {
    ...Type.h1,
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Type.body,
    color: Palette.textSecondary,
  },
  verifyBtn: {
    marginTop: Spacing.xxl,
  },
  resend: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  resendText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '600',
  },
  resendDisabled: {
    color: Palette.textSecondary,
    fontWeight: '500',
  },
});
