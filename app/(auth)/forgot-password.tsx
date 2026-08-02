import { Mail, ShieldCheck } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { FormField } from '@/components/auth/FormField';
import { OtpInput } from '@/components/auth/OtpInput';
import { Screen } from '@/components/Screen';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useSafeBack } from '@/hooks/useSafeBack';
import { requestPasswordReset, verifyPasswordRecoveryOtp } from '@/lib/auth';
import { friendlyAuthError, isNetworkError } from '@/lib/auth/authErrors';
import { hapticButtonPress, hapticSuccess } from '@/lib/haptics';
import { loadRememberedLogin } from '@/lib/loginRemember';

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

/** Custom LastBag reset emails send an 8-digit code (same as signup OTP). */
const RECOVERY_OTP_LENGTH = 8;
const RESEND_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const goBack = useSafeBack('/(auth)/login');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    void (async () => {
      const fromParams = typeof params.email === 'string' ? params.email.trim() : '';
      if (fromParams) {
        form.reset({ email: fromParams });
        return;
      }
      const saved = await loadRememberedLogin();
      if (saved.email) form.reset({ email: saved.email });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendSeconds]);

  const sendCode = async (email: string) => {
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await requestPasswordReset(email);
      if (resetError) {
        setError(friendlyAuthError(resetError, 'Could not send reset code.'));
        return false;
      }
      void hapticSuccess();
      setSentTo(email.trim().toLowerCase());
      setStep('otp');
      setOtp('');
      setResendSeconds(RESEND_SECONDS);
      return true;
    } catch (err) {
      setError(
        friendlyAuthError(
          err,
          isNetworkError(err)
            ? 'No internet connection. Please check your connection and try again.'
            : 'Could not send reset code.',
        ),
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const onSendEmail = form.handleSubmit(async (values) => {
    await sendCode(values.email);
  });

  const onResend = async () => {
    if (!sentTo || resendSeconds > 0 || loading) return;
    void hapticButtonPress();
    await sendCode(sentTo);
  };

  const onVerifyOtp = async (code: string) => {
    if (!sentTo || code.length < RECOVERY_OTP_LENGTH || verifying) return;
    setError(null);
    setVerifying(true);
    try {
      const { data, error: verifyError } = await verifyPasswordRecoveryOtp(sentTo, code);
      if (verifyError || !data) {
        setError(friendlyAuthError(verifyError, 'Invalid or expired code. Try again.'));
        return;
      }
      void hapticSuccess();
      router.replace('/(auth)/reset-password');
    } catch (err) {
      setError(
        friendlyAuthError(
          err,
          isNetworkError(err)
            ? 'No internet connection. Please check your connection and try again.'
            : 'Could not verify code.',
        ),
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <StatusBar style="dark" />

      <AuthScreenHeader
        title="Forgot password"
        subtitle={
          step === 'email'
            ? 'We’ll email an 8-digit code to reset your password'
            : 'Enter the 8-digit code from your email'
        }
        onBack={
          step === 'otp'
            ? () => {
                setStep('email');
                setError(null);
                setOtp('');
              }
            : goBack
        }
      />

      <AuthFormCard>
        {step === 'email' ? (
          <>
            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <ShieldCheck size={20} color={Palette.primary} strokeWidth={2.2} />
              </View>
              <Text style={styles.introText}>
                You’ll get an 8-digit code by email — enter it here, then choose a new password.
              </Text>
            </View>

            <Controller
              control={form.control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormField
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="you@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="username"
                  error={form.formState.errors.email?.message}
                />
              )}
            />
            {error ? <AuthErrorBanner message={error} /> : null}
            <AuthButton
              label="Send code"
              onPress={onSendEmail}
              loading={loading}
              style={styles.submit}
            />
          </>
        ) : (
          <>
            <View style={styles.sentRow}>
              <View style={styles.successIcon}>
                <Mail size={22} color={Palette.primary} strokeWidth={2} />
              </View>
              <View style={styles.sentCopy}>
                <Text style={styles.sentTitle}>Code sent</Text>
                <Text style={styles.sentBody}>
                  Check <Text style={styles.sentEmail}>{sentTo}</Text>
                </Text>
              </View>
            </View>

            <Text style={styles.otpLabel}>Enter code</Text>
            <OtpInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError(null);
                if (value.length >= RECOVERY_OTP_LENGTH) {
                  void onVerifyOtp(value);
                }
              }}
              length={RECOVERY_OTP_LENGTH}
              autoComplete="one-time-code"
              error={error ?? undefined}
            />
            {error ? <AuthErrorBanner message={error} /> : null}

            <AuthButton
              label="Verify code"
              onPress={() => void onVerifyOtp(otp)}
              loading={verifying}
              disabled={otp.length < RECOVERY_OTP_LENGTH}
              style={styles.submit}
            />

            <Pressable
              onPress={() => void onResend()}
              disabled={resendSeconds > 0 || loading}
              hitSlop={8}
              style={styles.resendBtn}>
              <Text
                style={[
                  styles.resendText,
                  (resendSeconds > 0 || loading) && styles.resendDisabled,
                ]}>
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setStep('email');
                setError(null);
                setOtp('');
              }}
              hitSlop={8}
              style={styles.changeEmail}>
              <Text style={styles.changeEmailText}>Use a different email</Text>
            </Pressable>
          </>
        )}
      </AuthFormCard>

      <View style={styles.hintCard}>
        <Text style={styles.hintTitle}>Phone-only account?</Text>
        <Text style={styles.hintBody}>
          Use the Phone tab on login (SMS code). Password reset needs an email on the account.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xxl,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.overlay.border,
  },
  introIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    flex: 1,
    ...Type.caption,
    color: Palette.primaryDark,
    lineHeight: 18,
    fontWeight: '500',
  },
  submit: {
    marginTop: Spacing.sm,
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentCopy: {
    flex: 1,
    gap: 2,
  },
  sentTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  sentBody: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  sentEmail: {
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  otpLabel: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  resendText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
  resendDisabled: {
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  changeEmail: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  changeEmailText: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  hintCard: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  hintTitle: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  hintBody: {
    ...Type.caption,
    color: Palette.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
