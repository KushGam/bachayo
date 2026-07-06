import { zodResolver } from '@hookform/resolvers/zod';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthMethodToggle } from '@/components/auth/AuthMethodToggle';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { FormField } from '@/components/auth/FormField';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PasswordField } from '@/components/auth/PasswordField';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { Screen } from '@/components/Screen';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { t } from '@/constants/i18n';
import { useSafeBack } from '@/hooks/useSafeBack';
import {
  navigateAfterGoogleSignIn,
  navigateAfterPasswordSignIn,
  signInWithEmail,
  signInWithPhone,
} from '@/lib/auth';
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const { locale, setAuthRole } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const goBack = useSafeBack('/(auth)/welcome');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      authMethod: 'phone',
      email: '',
      phone: '',
      password: '',
    },
  });

  const authMethod = watch('authMethod');

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    setLoading(true);

    try {
      const { data, error } =
        values.authMethod === 'email'
          ? await signInWithEmail(values.email, values.password)
          : await signInWithPhone(values.phone, values.password);

      if (error || !data.user) {
        setSubmitError(
          error?.message?.toLowerCase().includes('invalid login credentials')
            ? 'Incorrect email/phone or password.'
            : error?.message || t(locale, 'authError'),
        );
        setLoading(false);
        return;
      }

      const result = await navigateAfterPasswordSignIn(router, setAuthRole, data.user.id);
      if (!result.ok) {
        setSubmitError(result.error);
      }
    } catch {
      setSubmitError(t(locale, 'authError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (Constants.appOwnership === 'expo') {
      Alert.alert(
        'Sign in with phone or email',
        'Google Sign-In is available in the full LastBag app. For now please use your phone number or email address.',
        [{ text: 'Got it', style: 'default' }],
      );
      return;
    }

    setSubmitError(null);
    setGoogleLoading(true);

    try {
      const result = await navigateAfterGoogleSignIn(router, setAuthRole);
      if (!result.ok && !result.cancelled) {
        setSubmitError(t(locale, 'authError'));
      }
    } catch {
      Alert.alert('Error', 'Google Sign-In failed. Please try phone or email instead.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <StatusBar style="dark" />

      <AuthScreenHeader
        title="Welcome back"
        subtitle="Log in with your email or phone and password"
        onBack={goBack}
      />

      <Controller
        control={control}
        name="authMethod"
        render={({ field: { value, onChange } }) => (
          <AuthMethodToggle
            value={value}
            onChange={(method) => {
              onChange(method);
              setValue('email', '');
              setValue('phone', '');
            }}
          />
        )}
      />

      <AuthFormCard>
        {authMethod === 'email' ? (
          <Controller
            control={control}
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
                error={errors.email?.message}
              />
            )}
          />
        ) : (
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <PhoneInput
                label="Phone number"
                value={value}
                onChange={onChange}
                placeholder={t(locale, 'phonePlaceholder')}
                error={errors.phone?.message}
              />
            )}
          />
        )}

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <PasswordField
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Your password"
              error={errors.password?.message}
            />
          )}
        />

        {submitError ? <AuthErrorBanner message={submitError} /> : null}

        <AuthButton
          label="Log in"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.submit}
        />
      </AuthFormCard>

      <View style={styles.footer}>
        <Pressable onPress={() => router.push('/(auth)/signup-customer/basics')} style={styles.textLink}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xxl,
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
