import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { OtpInput } from '@/components/auth/OtpInput';
import { Screen } from '@/components/Screen';
import { t } from '@/constants/i18n';
import { Palette } from '@/constants/Colors';
import { hasPartnerProfile, sendPhoneOtp, upsertProfile, verifyPhoneOtp } from '@/lib/auth';
import { otpSchema, type OtpFormValues } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/useAuthStore';

const RESEND_SECONDS = 60;

export default function VerifyScreen() {
  const router = useRouter();
  const { locale, pendingPhone, pendingRole } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

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
      router.replace('/(auth)/phone');
    }
  }, [pendingPhone, router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const redirectAfterAuth = useCallback(
    async (userId: string) => {
      if (pendingRole === 'partner') {
        const exists = await hasPartnerProfile(userId);
        router.replace(exists ? '/(tabs)' : '/(auth)/onboarding-partner');
        return;
      }
      router.replace('/(tabs)');
    },
    [pendingRole, router],
  );

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

    const { error: profileError } = await upsertProfile(
      data.user.id,
      pendingPhone,
      pendingRole,
    );

    setLoading(false);

    if (profileError) {
      setSubmitError(profileError.message || t(locale, 'authError'));
      return;
    }

    await redirectAfterAuth(data.user.id);
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
      <Pressable onPress={() => router.back()} style={styles.back}>
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
    paddingBottom: 32,
  },
  back: {
    marginTop: 8,
    marginBottom: 24,
    width: 40,
  },
  backText: {
    fontSize: 24,
    color: Palette.textPrimary,
  },
  header: {
    marginBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textMuted,
    lineHeight: 22,
  },
  verifyBtn: {
    marginTop: 32,
  },
  resend: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    color: Palette.primary,
    fontWeight: '600',
  },
  resendDisabled: {
    color: Palette.textMuted,
    fontWeight: '500',
  },
});
