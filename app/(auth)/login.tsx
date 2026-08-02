import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthNoAccountPrompt } from '@/components/auth/AuthNoAccountPrompt';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { FormField } from '@/components/auth/FormField';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PasswordField } from '@/components/auth/PasswordField';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { RememberMeToggle } from '@/components/auth/RememberMeToggle';
import { TermsAcceptanceModal } from '@/components/auth/TermsAcceptanceModal';
import { Screen } from '@/components/Screen';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { t } from '@/constants/i18n';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { useSafeBack } from '@/hooks/useSafeBack';
import {
  friendlyAuthError,
  friendlyGoogleSignInError,
  isInvalidCredentialsError,
  isNetworkError,
} from '@/lib/auth/authErrors';
import { markIntentionalSignOut } from '@/lib/auth/signOutIntent';
import {
  fetchUserRole,
  navigateAfterGoogleSignIn,
  navigateAfterPasswordSignIn,
  signInWithEmail,
  signInWithPhone,
} from '@/lib/auth';
import {
  clearRememberedLogin,
  loadRememberedLogin,
  saveRememberedLogin,
  type RememberedLoginMethod,
} from '@/lib/loginRemember';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { recordTermsAcceptance } from '@/lib/terms';
import { clearPushTokenForCurrentUser } from '@/lib/notifications';
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
  const [emailNoAccount, setEmailNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingGoogleUserId, setPendingGoogleUserId] = useState<string | null>(null);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [rememberReady, setRememberReady] = useState(false);
  const goBack = useSafeBack('/(auth)/welcome');

  const {
    sendOTP,
    loading: phoneLoading,
    validatePhone,
  } = usePhoneAuth();

  const emailForm = useForm({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { phone: '', password: '' },
  });

  useEffect(() => {
    void (async () => {
      const saved = await loadRememberedLogin();
      if (saved.remember) {
        setRememberLogin(true);
        if (saved.email) {
          emailForm.reset({ email: saved.email, password: '' });
        }
        if (saved.phone) {
          setPhone(saved.phone);
          passwordForm.reset({ phone: saved.phone, password: '' });
        }
        if (saved.lastMethod) {
          setTab(saved.lastMethod);
        } else if (saved.email) {
          setTab('email');
        } else if (saved.phone) {
          setTab('phone');
        }
      }
      setRememberReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  const handleRememberChange = (next: boolean) => {
    setRememberLogin(next);
    if (!next) {
      void clearRememberedLogin();
    }
  };

  const persistRemember = async (values: {
    email?: string;
    phone?: string;
    lastMethod: RememberedLoginMethod;
  }) => {
    await saveRememberedLogin({
      remember: rememberLogin,
      email: values.email,
      phone: values.phone,
      lastMethod: values.lastMethod,
    });
  };

  const handleSendPhoneCode = async () => {
    setSubmitError(null);
    setPhoneError(null);
    setEmailNoAccount(false);

    if (!validatePhone(phone)) {
      setPhoneError('Enter a valid Nepal number');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(phone);
      if (!result.success) {
        setSubmitError(
          result.error ||
            friendlyAuthError(result.error, 'Could not send verification code.'),
        );
        return;
      }

      await persistRemember({ phone, lastMethod: 'phone' });
      setPendingPhone(phone);
      setPendingMode('login');
      router.push({
        pathname: '/(auth)/verify-phone',
        params: { mode: 'login' },
      } as never);
    } catch (err) {
      setSubmitError(
        friendlyAuthError(
          err,
          isNetworkError(err)
            ? 'No internet connection. Please check your connection and try again.'
            : t(locale, 'authError'),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = emailForm.handleSubmit(async (values) => {
    setSubmitError(null);
    setEmailNoAccount(false);
    setLoading(true);
    try {
      const { data, error } = await signInWithEmail(values.email, values.password);
      if (error || !data.user) {
        if (isInvalidCredentialsError(error)) {
          setEmailNoAccount(true);
          return;
        }
        setSubmitError(friendlyAuthError(error, t(locale, 'authError')));
        return;
      }
      await persistRemember({ email: values.email, lastMethod: 'email' });
      const result = await navigateAfterPasswordSignIn(router, setAuthRole, data.user.id);
      if (!result.ok) setSubmitError(result.error);
    } catch (err) {
      setSubmitError(
        friendlyAuthError(
          err,
          isNetworkError(err)
            ? 'No internet connection. Please check your connection and try again.'
            : t(locale, 'authError'),
        ),
      );
    } finally {
      setLoading(false);
    }
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
    setSubmitError(null);
    setEmailNoAccount(false);
    setLoading(true);
    try {
      const { data, error } = await signInWithPhone(values.phone, values.password);
      if (error || !data.user) {
        setSubmitError(
          isInvalidCredentialsError(error)
            ? 'Wrong phone number or password. Please try again.'
            : friendlyAuthError(error, t(locale, 'authError')),
        );
        return;
      }
      await persistRemember({ phone: values.phone, lastMethod: 'password' });
      const result = await navigateAfterPasswordSignIn(router, setAuthRole, data.user.id);
      if (!result.ok) setSubmitError(result.error);
    } catch (err) {
      setSubmitError(
        friendlyAuthError(
          err,
          isNetworkError(err)
            ? 'No internet connection. Please check your connection and try again.'
            : t(locale, 'authError'),
        ),
      );
    } finally {
      setLoading(false);
    }
  });

  const clearEmailForm = () => {
    emailForm.reset({ email: '', password: '' });
    setEmailNoAccount(false);
    setSubmitError(null);
  };
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
    } catch (err) {
      console.error('[Google] Sign-in failed:', err);
      Alert.alert('Couldn’t sign in with Google', friendlyGoogleSignInError(err));
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
                setEmailNoAccount(false);
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
            {rememberReady ? (
              <RememberMeToggle value={rememberLogin} onChange={handleRememberChange} />
            ) : null}
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
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="username"
                  importantForAutofill="yes"
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
            <View style={styles.rowBetween}>
              {rememberReady ? (
                <RememberMeToggle value={rememberLogin} onChange={handleRememberChange} />
              ) : (
                <View />
              )}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/forgot-password',
                    params: { email: emailForm.getValues('email') || '' },
                  })
                }
                hitSlop={8}
                style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>
            {submitError ? <AuthErrorBanner message={submitError} /> : null}
            {emailNoAccount ? (
              <AuthNoAccountPrompt
                title="No account found with this email."
                body="Want to sign up instead?"
                primaryLabel="Sign up →"
                secondaryLabel="Try again"
                onPrimary={() => router.push('/(auth)/welcome')}
                onSecondary={clearEmailForm}
              />
            ) : null}
            <AuthButton
              label="Log in"
              onPress={onEmailSubmit}
              loading={loading}
              style={styles.submit}
            />
            {submitError && submitError.toLowerCase().includes('internet') ? (
              <AuthButton
                label="Try again →"
                onPress={onEmailSubmit}
                variant="secondary"
                style={styles.submit}
              />
            ) : null}
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
            <View style={styles.rowBetween}>
              {rememberReady ? (
                <RememberMeToggle value={rememberLogin} onChange={handleRememberChange} />
              ) : (
                <View />
              )}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/forgot-password',
                    params: { email: emailForm.getValues('email') || '' },
                  })
                }
                hitSlop={8}
                style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>
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
          markIntentionalSignOut();
          await clearPushTokenForCurrentUser();
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: 2,
    marginBottom: 2,
  },
  forgotBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  forgotText: {
    ...Type.caption,
    color: Palette.primary,
    fontWeight: '700',
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
