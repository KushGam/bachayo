import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { FormField } from '@/components/auth/FormField';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PasswordField } from '@/components/auth/PasswordField';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { TermsAcceptanceModal } from '@/components/auth/TermsAcceptanceModal';
import { Screen } from '@/components/Screen';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { t } from '@/constants/i18n';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { useSafeBack } from '@/hooks/useSafeBack';
import {
  fetchUserRole,
  navigateAfterGoogleSignIn,
  navigateAfterPasswordSignIn,
  signInWithEmail,
  signInWithPhone,
} from '@/lib/auth';
import app, { isFirebaseConfigured } from '@/lib/firebase';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { recordTermsAcceptance } from '@/lib/terms';
import { supabase } from '@/lib/supabase';
import { passwordField, phoneSchema } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/useAuthStore';

type LoginTab = 'phone' | 'email' | 'password';

const emailLoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: passwordField,
});

const passwordLoginSchema = z.object({
  phone: phoneSchema.shape.phone,
  password: passwordField,
});

export default function LoginScreen() {
  const router = useRouter();
  const { locale, setAuthRole, setPendingPhone, setPendingMode } = useAuthStore();
  const [tab, setTab] = useState<LoginTab>('phone');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingGoogleUserId, setPendingGoogleUserId] = useState<string | null>(null);
  const goBack = useSafeBack('/(auth)/welcome');

  const {
    sendOTP,
    loading: phoneLoading,
    recaptchaVerifier,
    validatePhone,
  } = useFirebasePhoneAuth();

  const emailForm = useForm({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const handleSendPhoneCode = async () => {
    setSubmitError(null);
    setPhoneError(null);

    if (!validatePhone(phone)) {
      setPhoneError('Enter a valid Nepal number');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(phone);
      if (!result.success) {
        setSubmitError(result.error || 'Could not send verification code.');
        return;
      }

      setPendingPhone(phone);
      setPendingMode('login');
      router.push({
        pathname: '/(auth)/verify-phone',
        params: { mode: 'login' },
      } as never);
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = emailForm.handleSubmit(async (values) => {
    setSubmitError(null);
    setLoading(true);
    try {
      const { data, error } = await signInWithEmail(values.email, values.password);
      if (error || !data.user) {
        setSubmitError(
          error?.message?.toLowerCase().includes('invalid login credentials')
            ? 'Incorrect email or password.'
            : error?.message || t(locale, 'authError'),
        );
        return;
      }
      const result = await navigateAfterPasswordSignIn(router, setAuthRole, data.user.id);
      if (!result.ok) setSubmitError(result.error);
    } catch {
      setSubmitError(t(locale, 'authError'));
    } finally {
      setLoading(false);
    }
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
    setSubmitError(null);
    setLoading(true);
    try {
      const { data, error } = await signInWithPhone(values.phone, values.password);
      if (error || !data.user) {
        setSubmitError(
          error?.message?.toLowerCase().includes('invalid login credentials')
            ? 'Incorrect phone or password.'
            : error?.message || t(locale, 'authError'),
        );
        return;
      }
      const result = await navigateAfterPasswordSignIn(router, setAuthRole, data.user.id);
      if (!result.ok) setSubmitError(result.error);
    } catch {
      setSubmitError(t(locale, 'authError'));
    } finally {
      setLoading(false);
    }
  });

  const handleGoogleSignIn = async () => {
    setSubmitError(null);
    setGoogleLoading(true);
    try {
      const result = await navigateAfterGoogleSignIn(router, setAuthRole);
      if (!result.ok) {
        if (result.expoGo || result.cancelled) return;
        setSubmitError(t(locale, 'authError'));
        return;
      }
      if (result.needsTerms) {
        setPendingGoogleUserId(result.userId);
        setShowTermsModal(true);
      }
    } catch {
      Alert.alert('Error', 'Google Sign-In failed. Please try phone or email instead.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const tabs: { key: LoginTab; label: string }[] = [
    { key: 'phone', label: '📱 Phone' },
    { key: 'email', label: '📧 Email' },
    { key: 'password', label: '🔑 Password' },
  ];

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      {isFirebaseConfigured && app ? (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={app.options}
          attemptInvisibleVerification
        />
      ) : null}

      <AuthScreenHeader
        title="Welcome back"
        subtitle="Log in with phone, email, or password"
        onBack={goBack}
      />

      <View style={styles.track}>
        {tabs.map(({ key, label }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                setTab(key);
                setSubmitError(null);
                setPhoneError(null);
              }}
              style={[styles.option, active && styles.optionActive]}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AuthFormCard>
        {tab === 'phone' ? (
          <>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              error={phoneError ?? undefined}
            />
            {submitError ? <AuthErrorBanner message={submitError} /> : null}
            <AuthButton
              label="Send code →"
              onPress={() => void handleSendPhoneCode()}
              loading={loading || phoneLoading}
              style={styles.submit}
            />
          </>
        ) : null}

        {tab === 'email' ? (
          <>
            <Controller
              control={emailForm.control}
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
                  error={emailForm.formState.errors.email?.message}
                />
              )}
            />
            <Controller
              control={emailForm.control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <PasswordField
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Your password"
                  error={emailForm.formState.errors.password?.message}
                />
              )}
            />
            {submitError ? <AuthErrorBanner message={submitError} /> : null}
            <AuthButton
              label="Log in"
              onPress={onEmailSubmit}
              loading={loading}
              style={styles.submit}
            />
          </>
        ) : null}

        {tab === 'password' ? (
          <>
            <Controller
              control={passwordForm.control}
              name="phone"
              render={({ field: { value, onChange } }) => (
                <PhoneInput
                  label="Phone number"
                  value={value}
                  onChange={onChange}
                  placeholder={t(locale, 'phonePlaceholder')}
                  error={passwordForm.formState.errors.phone?.message}
                />
              )}
            />
            <Controller
              control={passwordForm.control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <PasswordField
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Your password"
                  error={passwordForm.formState.errors.password?.message}
                />
              )}
            />
            {submitError ? <AuthErrorBanner message={submitError} /> : null}
            <AuthButton
              label="Log in"
              onPress={onPasswordSubmit}
              loading={loading}
              style={styles.submit}
            />
          </>
        ) : null}
      </AuthFormCard>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/(auth)/signup-customer/basics')}
          style={styles.textLink}>
          <Text style={styles.textLinkMuted}>New here? </Text>
          <Text style={styles.textLinkAccent}>Create an account</Text>
        </Pressable>

        <AuthDivider />

        <GoogleSignInButton
          label={t(locale, 'googleCta')}
          onPress={handleGoogleSignIn}
          loading={googleLoading}
        />
      </View>

      <TermsAcceptanceModal
        visible={showTermsModal}
        onAccept={async () => {
          if (!pendingGoogleUserId) return;
          const { error } = await recordTermsAcceptance(pendingGoogleUserId);
          if (error) {
            Alert.alert('Could not save', error.message);
            return;
          }
          setShowTermsModal(false);
          const role = await fetchUserRole(pendingGoogleUserId);
          setAuthRole(role ?? 'customer');
          router.replace(await resolveAuthenticatedRoute(pendingGoogleUserId, role ?? 'customer'));
        }}
        onCancel={async () => {
          setShowTermsModal(false);
          setPendingGoogleUserId(null);
          await supabase.auth.signOut();
          Alert.alert('Sign in cancelled', 'You must accept the terms to use LastBag.');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xxl,
  },
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(216, 90, 48, 0.12)',
    marginBottom: Spacing.lg,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 999,
  },
  optionActive: {
    backgroundColor: Palette.white,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  optionText: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: Palette.primaryDark,
  },
  submit: {
    marginTop: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.xxl,
    gap: Spacing.lg,
  },
  textLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  textLinkMuted: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
  },
  textLinkAccent: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '700',
  },
});
