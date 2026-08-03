import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { FormField } from '@/components/auth/FormField';
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
import { useSignupStore } from '@/store/useSignupStore';
import type { UserRole } from '@/types/database';

const completeProfileSchema = z.object({
  phone: phoneSchema.shape.phone,
});

type CompleteProfileValues = z.infer<typeof completeProfileSchema>;
type Step = 'phone' | 'otp';

const RESEND_SECONDS = 60;

function localFromPhoneEmail(email: string | null | undefined) {
  if (!email?.endsWith('@lastbag.phone')) return null;
  const digits = email.split('@')[0] ?? '';
  const local = digits.replace(/^977/, '');
  return /^(97|98)\d{8}$/.test(local) ? local : null;
}

export default function CompleteProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    role?: string;
    userId?: string;
    fromPhoneSignup?: string;
  }>();
  const { locale, pendingRole, setPendingRole, setAuthRole, setPendingPhone, setPendingName } =
    useAuthStore();
  const { setCustomer, setPartner } = useSignupStore();
  const [userId, setUserId] = useState<string | null>(
    typeof params.userId === 'string' ? params.userId : null,
  );
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phoneTaken, setPhoneTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step, setStep] = useState<Step>('phone');
  const [pendingPhone, setPendingPhoneLocal] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneSignupMode, setPhoneSignupMode] = useState(params.fromPhoneSignup === '1');
  const [verifiedPhoneLocal, setVerifiedPhoneLocal] = useState(
    typeof params.phone === 'string'
      ? params.phone.replace(/\s/g, '').replace(/^\+977/, '').replace(/^977/, '')
      : '',
  );
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

      const phoneLocal = localFromPhoneEmail(user.email);
      if (phoneLocal && params.fromPhoneSignup !== '1') {
        // Orphan phone-auth session (OTP minted auth user, no profile yet).
        setPhoneSignupMode(true);
        setVerifiedPhoneLocal(phoneLocal);
      }
    });
  }, [params.fromPhoneSignup, router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const role: UserRole =
    params.role === 'partner' || pendingRole === 'partner' ? 'partner' : 'customer';

  const finishPhoneSignupProfile = async () => {
    if (!userId) return;
    if (!fullName.trim()) {
      setNameError('Please enter your name');
      return;
    }
    if (fullName.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    setNameError('');
    setLoading(true);
    setSubmitError(null);

    try {
      const phoneE164 = verifiedPhoneLocal
        ? formatNepalPhone(verifiedPhoneLocal)
        : null;

      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phoneE164,
        role,
        onboarding_completed: false,
        terms_accepted_at: new Date().toISOString(),
        terms_version: 'v1.0',
      });
      if (error) throw error;

      await recordTermsAcceptance(userId);
      setAuthRole(role);
      setPendingRole(role);
      if (verifiedPhoneLocal) {
        setPendingPhone(verifiedPhoneLocal);
        setPendingName(fullName.trim());
        setCustomer({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: verifiedPhoneLocal,
        });
        setPartner({
          ownerName: fullName.trim(),
          email: email.trim(),
          phone: verifiedPhoneLocal,
          businessPhone: verifiedPhoneLocal,
        });
      }

      if (role === 'partner') {
        router.replace('/(auth)/signup-partner/business');
        return;
      }
      router.replace('/(auth)/signup-customer/location');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t(locale, 'authError'),
      );
    } finally {
      setLoading(false);
    }
  };

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

      setPendingPhoneLocal(phone);
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
          if (phoneSignupMode) {
            goBack();
            return;
          }
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

      {phoneSignupMode ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Complete your profile</Text>
            <Text style={styles.subtitle}>
              {verifiedPhoneLocal
                ? `Your number +977 ${verifiedPhoneLocal} is verified. Add your name to continue.`
                : 'Add your name to finish setting up your account.'}
            </Text>
          </View>

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

          <FormField
            label="Full name"
            value={fullName}
            onChangeText={(value) => {
              setFullName(value);
              setNameError('');
            }}
            placeholder="Your name"
            autoCapitalize="words"
            error={nameError || undefined}
          />

          <FormField
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <AuthButton
            label="Continue →"
            onPress={() => void finishPhoneSignupProfile()}
            loading={loading}
            style={styles.submit}
          />
        </>
      ) : null}

      {!phoneSignupMode && step === 'phone' ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Almost there</Text>
            <Text style={styles.subtitle}>
              {`${displayName ? `Hi ${displayName.split(' ')[0]}! ` : ''}Add a Nepal phone number for pickup updates. We’ll text you a code to confirm it.`}
            </Text>
            {userEmail ? (
              <Text style={styles.emailHint}>Signed in as {userEmail}</Text>
            ) : null}
          </View>

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
      ) : null}

      {!phoneSignupMode && step === 'otp' ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Verify your phone</Text>
            <Text style={styles.subtitle}>
              {`Enter the 6-digit code sent to +977 ${pendingPhone}`}
            </Text>
          </View>

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
      ) : null}
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
